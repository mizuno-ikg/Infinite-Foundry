'use strict';
const assert=require('assert');
const E=require('../engine.js');
globalThis.InfiniteFoundryEngine=E;
const M=require('../era-mechanics.js');

const SEEDS=Math.max(12,Number(process.env.IF_PROGRESSION_SEEDS)||24);
const MAX_CYCLES=80;

function pulseAndInvest(state){
  if(E.pulse(state))M.afterPulse(state);
  let guard=0;
  while(guard++<24&&!state.cycle.ended){
    const id=E.rawBottleneck(state),price=E.cost(state,id);
    if(!E.canUpgrade(state,id))break;
    const was=E.rawBottleneck(state)===id;
    if(!E.upgrade(state,id))break;
    M.afterUpgrade(state,id,price,was);
  }
}

function playCycle(state){
  let nextDecision=0;
  while(!state.cycle.ended){
    E.advance(state,Math.min(.5,E.currentEra(state).duration-state.cycle.time));
    if(state.cycle.ended)break;
    if(state.cycle.time+1e-9>=nextDecision){
      pulseAndInvest(state);
      nextDecision=state.cycle.time+1;
    }
  }
  return state;
}

function spendBlueprints(state){
  const order=['efficiency','capital','moduleBay','automation'];
  let bought=true,guard=0;
  while(bought&&guard++<32){
    bought=false;
    for(const id of order){
      if(E.buyMetaUpgrade(state,id)){bought=true;break;}
    }
  }
}

function spendPatents(state){
  let guard=0;
  while(state.meta.patents>0&&guard++<12){
    if(E.buyPatentUpgrade(state,'powerRouting'))continue;
    if(E.buyPatentUpgrade(state,'salvageTheory'))continue;
    break;
  }
}

function simulate(seed){
  let state=E.createState(E.baseMeta(seed));
  const attempts=Array(8).fill(0),fails=Array(8).fill(0),eraGameTime=Array(8).fill(0),ratios=Array.from({length:8},()=>[]);
  let cycles=0,totalGameTime=0;
  while(!state.meta.endingUnlocked&&cycles<MAX_CYCLES){
    const era=state.meta.era,target=E.currentEra(state).targets[3];
    attempts[era]++;
    playCycle(state);
    cycles++;
    totalGameTime+=E.currentEra(state).duration;
    eraGameTime[era]+=E.currentEra(state).duration;
    ratios[era].push(state.cycle.result.average/target);
    const win=state.cycle.result.win;
    if(!win)fails[era]++;
    spendBlueprints(state);
    spendPatents(state);
    if(state.meta.endingUnlocked)break;
    state=E.restart(state,win&&E.canAdvanceEra(state));
  }
  return {
    seed,finished:state.meta.endingUnlocked,cycles,totalGameTime,
    attempts:attempts.slice(1),fails:fails.slice(1),eraGameTime:eraGameTime.slice(1),ratios:ratios.slice(1),
    blueprints:state.meta.blueprints,patents:state.meta.patents,
    upgrades:{...state.meta.upgrades},patentUpgrades:{...state.meta.patentUpgrades}
  };
}

function quantile(values,p){
  const a=[...values].sort((x,y)=>x-y);
  return a[Math.floor((a.length-1)*p)];
}
function median(values){return quantile(values,.5)}
function minutes(seconds){return seconds/60}

const rows=[];
for(let i=1;i<=SEEDS;i++)rows.push(simulate((0x5eed000+i)>>>0));

const finishRate=rows.filter(r=>r.finished).length/rows.length;
const cycleValues=rows.map(r=>r.cycles),timeValues=rows.map(r=>r.totalGameTime);
const attemptMedians=Array.from({length:7},(_,i)=>median(rows.map(r=>r.attempts[i])));
const attemptP90=Array.from({length:7},(_,i)=>quantile(rows.map(r=>r.attempts[i]),.9));
const failMedians=Array.from({length:7},(_,i)=>median(rows.map(r=>r.fails[i])));
const worstCycles=Math.max(...cycleValues);

console.log('[progression] seeds',SEEDS,'finish',`${(finishRate*100).toFixed(0)}%`,
  '| cycles p50/p90/max',median(cycleValues),quantile(cycleValues,.9),worstCycles,
  '| x1 minutes p50/p90',minutes(median(timeValues)).toFixed(1),minutes(quantile(timeValues,.9)).toFixed(1),
  '| x4 minutes p50/p90',minutes(median(timeValues)/4).toFixed(1),minutes(quantile(timeValues,.9)/4).toFixed(1));
console.log('[progression] attempts p50 by era',attemptMedians.join('/'),'p90',attemptP90.join('/'),'fails p50',failMedians.join('/'));
for(let era=1;era<=7;era++){
  const maxAttempt=Math.max(...rows.map(r=>r.ratios[era-1].length));
  const med=[];
  for(let n=0;n<Math.min(maxAttempt,8);n++){
    const vals=rows.map(r=>r.ratios[era-1][n]).filter(Number.isFinite);
    if(vals.length)med.push(`${n+1}:${median(vals).toFixed(2)}`);
  }
  console.log(`[progression] E${era} median final/target by attempt`,med.join(' '));
}

assert.strictEqual(finishRate,1,'every sampled full run should reach the ending');
assert.ok(worstCycles<=40,`sampled progression should not become a prestige grind (max ${worstCycles})`);
for(let era=2;era<=7;era++){
  assert.ok(attemptMedians[era-1]<=3,`Era ${era} median attempts too high: ${attemptMedians[era-1]}`);
  assert.ok(attemptP90[era-1]<=5,`Era ${era} p90 attempts suggests RNG/prestige wall: ${attemptP90[era-1]}`);
}
assert.ok(rows.some(r=>r.upgrades.efficiency>0),'efficiency must be purchased');
assert.ok(rows.some(r=>r.upgrades.capital>0),'capital must be purchased');
assert.ok(rows.some(r=>r.upgrades.moduleBay>0),'module bay must be reachable');
assert.ok(rows.every(r=>r.patentUpgrades.powerRouting>=1),'first patent should produce permanent progress');

console.log('progression balance tests passed');
