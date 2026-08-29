'use strict';

const { simulateRoute } = require('./human-proxy.js');

const MODES = ['attentive', 'relaxed'];
const SPEEDS = [1, 4, 8];
const DEFAULT_SEEDS = 12;
const DEFAULT_MAX_CYCLES = 40;

function q(values, p) {
  const xs = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
  if (!xs.length) return 0;
  return xs[Math.floor((xs.length - 1) * p)];
}
function median(values) { return q(values, 0.5); }
function rate(rows, pred) { return rows.length ? rows.filter(pred).length / rows.length : 0; }
function pct(n) { return `${(n * 100).toFixed(1)}%`; }
function num(n, d = 2) { return Number.isFinite(n) ? n.toFixed(d) : 'n/a'; }

function pairedDelta(rows, aSpeed, bSpeed, getter) {
  const bySeed = new Map();
  for (const row of rows) {
    if (!bySeed.has(row.seed)) bySeed.set(row.seed, new Map());
    bySeed.get(row.seed).set(row.requestedSpeed, row);
  }
  const deltas = [];
  for (const speeds of bySeed.values()) {
    const a = speeds.get(aSpeed), b = speeds.get(bSpeed);
    if (!a || !b) continue;
    const av = getter(a), bv = getter(b);
    if (Number.isFinite(av) && Number.isFinite(bv)) deltas.push(bv - av);
  }
  return { p50: median(deltas), p10: q(deltas, 0.1), p90: q(deltas, 0.9) };
}

function summarize(rows, mode, speed) {
  const subset = rows.filter(r => r.mode === mode && r.requestedSpeed === speed);
  const era = Array.from({ length: 7 }, (_, i) => {
    const reached = subset.filter(r => Number(r.attempts[i]) > 0);
    const first = subset.filter(r => r.firstAttemptWins[i] != null);
    return {
      era: i + 1,
      reachedRate: subset.length ? reached.length / subset.length : 0,
      firstAttemptClear: first.length ? rate(first, r => !!r.firstAttemptWins[i]) : 0,
      attemptP50: reached.length ? median(reached.map(r => r.attempts[i])) : 0,
      attemptP90: reached.length ? q(reached.map(r => r.attempts[i]), 0.9) : 0
    };
  });
  return {
    mode,
    speed,
    finishRate: rate(subset, r => r.finished),
    cyclesP50: median(subset.map(r => r.cycles)),
    cyclesP90: q(subset.map(r => r.cycles), 0.9),
    decisionsPerRealMinuteP50: median(subset.map(r => r.decisionsPerRealMinute)),
    buysPerRealMinuteP50: median(subset.map(r => r.buysPerRealMinute)),
    finalMemoryP50: median(subset.map(r => r.foundryMemory || 0)),
    era
  };
}

function acceptance(rows, mode) {
  const x4 = summarize(rows, mode, 4);
  const x8 = summarize(rows, mode, 8);
  const densityRatio = x4.decisionsPerRealMinuteP50 > 0 ? x8.decisionsPerRealMinuteP50 / x4.decisionsPerRealMinuteP50 : 1;
  const memoryRatio = x4.finalMemoryP50 > 0 ? x8.finalMemoryP50 / x4.finalMemoryP50 : 1;
  const lateAttemptPenalty = median([4, 5, 6].map(i => x8.era[i].attemptP50 - x4.era[i].attemptP50));
  const lateReachPenalty = median([4, 5, 6].map(i => x4.era[i].reachedRate - x8.era[i].reachedRate));
  const earlyClearPenalty = median([0, 1, 2].map(i => x4.era[i].firstAttemptClear - x8.era[i].firstAttemptClear));

  // x8 is a QoL reward, not a harder input mode. Failures favor removing x8 over adding heavy assist.
  const checks = {
    operationDensity: densityRatio <= 1.35,
    finishRate: x8.finishRate + 0.10 >= x4.finishRate,
    memoryProgress: memoryRatio >= 0.85,
    earlyClear: earlyClearPenalty <= 0.20,
    lateReach: lateReachPenalty <= 0.15,
    lateAttempts: lateAttemptPenalty <= 2
  };
  return {
    mode,
    pass: Object.values(checks).every(Boolean),
    checks,
    metrics: { densityRatio, memoryRatio, earlyClearPenalty, lateReachPenalty, lateAttemptPenalty,
      finishRate4: x4.finishRate, finishRate8: x8.finishRate }
  };
}

function markdown(summaries, decisions) {
  const out = ['# M14 paired speed report', '',
    'Same-seed human-like routes. Requested x8 is clamped to x4 until Automation Lv1, then uses x8.',
    'Attempt percentiles exclude routes that never reached that Era; reached rate is reported separately.', ''];
  for (const mode of MODES) {
    out.push(`## ${mode}`, '', '| speed | finish | cycles p50/p90 | decisions / real min | buys / real min | final Memory p50 |',
      '|---:|---:|---:|---:|---:|---:|');
    for (const s of summaries.filter(x => x.mode === mode)) {
      out.push(`| x${s.speed} | ${pct(s.finishRate)} | ${num(s.cyclesP50,0)} / ${num(s.cyclesP90,0)} | ${num(s.decisionsPerRealMinuteP50)} | ${num(s.buysPerRealMinuteP50)} | ${num(s.finalMemoryP50,0)} |`);
    }
    out.push('', '| Era | x1 reached / attempts p50-p90 | x4 reached / attempts p50-p90 | x8 reached / attempts p50-p90 |', '|---:|---:|---:|---:|');
    const bySpeed = Object.fromEntries(summaries.filter(x => x.mode === mode).map(x => [x.speed, x]));
    for (let i = 0; i < 7; i++) {
      const cell = sp => `${pct(bySpeed[sp].era[i].reachedRate)} / ${num(bySpeed[sp].era[i].attemptP50,0)}-${num(bySpeed[sp].era[i].attemptP90,0)}`;
      out.push(`| ${i + 1} | ${cell(1)} | ${cell(4)} | ${cell(8)} |`);
    }
    const d = decisions.find(x => x.mode === mode);
    out.push('', `M14 x8 acceptance: **${d.pass ? 'PASS' : 'REVIEW / REMOVE x8'}**`,
      `- decision-density ratio x8/x4: ${num(d.metrics.densityRatio)} (${d.checks.operationDensity ? 'pass' : 'fail'})`,
      `- finish rate x4 -> x8: ${pct(d.metrics.finishRate4)} -> ${pct(d.metrics.finishRate8)} (${d.checks.finishRate ? 'pass' : 'fail'})`,
      `- Memory ratio x8/x4: ${num(d.metrics.memoryRatio)} (${d.checks.memoryProgress ? 'pass' : 'fail'})`,
      `- early first-attempt clear penalty: ${pct(d.metrics.earlyClearPenalty)} (${d.checks.earlyClear ? 'pass' : 'fail'})`,
      `- late-era reach penalty: ${pct(d.metrics.lateReachPenalty)} (${d.checks.lateReach ? 'pass' : 'fail'})`,
      `- late-era median attempt penalty: ${num(d.metrics.lateAttemptPenalty,0)} (${d.checks.lateAttempts ? 'pass' : 'fail'})`, '');
  }
  return out.join('\n');
}

function run() {
  const seeds = Math.max(6, Number(process.env.IF_M14_SEEDS) || DEFAULT_SEEDS);
  const maxCycles = Math.max(10, Number(process.env.IF_M14_MAX_CYCLES) || DEFAULT_MAX_CYCLES);
  const focusPolicy = process.env.IF_M14_FOCUS || 'losing';
  const rows = [];
  for (const mode of MODES) {
    for (let i = 1; i <= seeds; i++) {
      const seed = (0x7140000 + i) >>> 0;
      for (const speed of SPEEDS) rows.push(simulateRoute(seed, { mode, speed, maxCycles, focusPolicy }));
    }
  }
  const summaries = MODES.flatMap(mode => SPEEDS.map(speed => summarize(rows, mode, speed)));
  const decisions = MODES.map(mode => acceptance(rows, mode));
  const paired = MODES.map(mode => {
    const subset = rows.filter(r => r.mode === mode);
    return { mode, x4ToX8: {
      cycles: pairedDelta(subset, 4, 8, r => r.cycles),
      memory: pairedDelta(subset, 4, 8, r => r.foundryMemory || 0),
      decisionsPerRealMinute: pairedDelta(subset, 4, 8, r => r.decisionsPerRealMinute)
    }};
  });
  const report = { seeds, maxCycles, focusPolicy, summaries, decisions, paired };
  if (process.env.IF_M14_JSON === '1') console.log(JSON.stringify(report, null, 2));
  else console.log(markdown(summaries, decisions));
  if (process.env.IF_M14_STRICT === '1' && decisions.some(x => !x.pass)) process.exitCode = 2;
}

if (require.main === module) run();
module.exports = { summarize, acceptance, pairedDelta, markdown };
