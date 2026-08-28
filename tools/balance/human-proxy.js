'use strict';
const E=require('../../engine.js');
const installPrestige=require('../../prestige-m11.js');
const P=installPrestige(E);
globalThis.InfiniteFoundryEngine=E;
const M=require('../../era-mechanics.js');

const MODES={
  optimal:{minDelay:1,maxDelay:1,pulseChance:1,maxBuys:24},
  attentive:{minDelay:7,maxDelay:12,pulseChance:.82,maxBuys:12},
  relaxed:{minDelay:12,maxDelay:20,pulseChance:.52,maxBuys:8}
};
const SPEEDS=[1,2,4,8];
function rng(seed){let x=(seed>>>0)||0x9e3779b9;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
function normalizeSpeed(speed){const v=Number(speed)||1;return SPEEDS.includes(v)?v:1}
function delayFor(r,mode){const d=MODES[mode]||MODES.attentive;return d.minDelay+r()*(d.maxDelay-d.minDelay)}
function decisionDelayGameSeconds(r,mode,speed=1){return delayFor(r,mode)*normalizeSpeed(speed)}
function decide(state,r,mode){const d=MODES[mode]||MODES.attentive;if(r()<d.pulseChance&&E.pulse(state))M.afterPulse(state);let buys=0;while(buys<d.maxBuys&&!state.cycle.ended){const id=E.rawBottleneck(state),price=E.cost(state,id);if(!E.canUpgrade(state,id))break;const was=E.rawBottleneck(state)===id;if(!E.upgrade(state,id))break;M.afterUpgrade(state,id,price,was);buys++}return buys}
function focusWanted(policy,state){
  if(policy==='always')return true;
  if(policy==='late')return state.cycle.time>=E.currentEra(state).duration*.55;
  if(policy==='losing'){
    const era=E.currentEra(state),elapsed=Math.max(1,state.cycle.time),pace=E.sustainedAverage(state,30)/(E.directivesFor(state).at(-1)?.target||1);
    return elapsed>=era.duration*.60&&pace<.55;
  }
  return false;
}
function playCycle(state,{mode='attentive',seed=1,focusPolicy='off',speed=1}={}){
  const r=rng(seed),era=E.currentEra(state),simSpeed=normalizeSpeed(speed);let nextDecision=0,decisions=0,buys=0,focusChanges=0;
  while(!state.cycle.ended){
    const remaining=era.duration-state.cycle.time;if(remaining<=1e-9){E.advance(state,.05);break}
    const step=Math.min(remaining,Math.max(.05,nextDecision-state.cycle.time));if(step>0)E.advance(state,step);if(state.cycle.ended)break;
    if(state.cycle.time+1e-9>=nextDecision){
      const wanted=focusWanted(focusPolicy,state);if(P.setResearchFocus(state,wanted))focusChanges++;
      buys+=decide(state,r,mode);decisions++;nextDecision=state.cycle.time+decisionDelayGameSeconds(r,mode,simSpeed);
    }
  }
  const moduleRecoveries=state.cycle.moduleInventory.length;
  const automationUpgrades=state.cycle.events.filter(x=>x.type==='automationUpgrade').length;
  const realSeconds=era.duration/simSpeed,realMinutes=realSeconds/60;
  return {state,speed:simSpeed,realSeconds,decisions,buys,focusChanges,moduleRecoveries,automationUpgrades,decisionsPerRealMinute:realMinutes>0?decisions/realMinutes:0,buysPerRealMinute:realMinutes>0?buys/realMinutes:0,ratio:state.cycle.result.average/E.currentEra(state).targets[3],memoryEarned:Number(state.cycle.result.memoryEarned)||0,researchData:Number(state.cycle.researchData)||0};
}
function spendBlueprints(state){const order=['efficiency','capital','moduleBay','automation'];let changed=true,guard=0;while(changed&&guard++<32){changed=false;for(const id of order){if(E.buyMetaUpgrade(state,id)){changed=true;break}}}}
function spendPatents(state){let guard=0;while(state.meta.patents>0&&guard++<12){if(E.buyPatentUpgrade(state,'powerRouting'))continue;if(E.buyPatentUpgrade(state,'salvageTheory'))continue;break}}
function startingCredits(state){return Number(state?.cycle?.credits)||0}
function nextBreakthrough(meta){return P.BREAKTHROUGHS.find(x=>x.threshold>(Number(meta?.foundryMemory)||0))||null}
function simulateRoute(seed,{mode='attentive',maxCycles=80,focusPolicy='off',speed=1}={}){
  const simSpeed=normalizeSpeed(speed);let state=E.createState(E.baseMeta(seed)),cycles=0,totalGameTime=0,totalRealTime=0,totalDecisions=0,totalBuys=0;const attempts=Array(8).fill(0),firstAttemptWins=Array(8).fill(null),ratios=Array.from({length:8},()=>[]),decisions=Array(8).fill(0),moduleRecoveries=Array.from({length:8},()=>[]),automationUpgrades=Array.from({length:8},()=>[]),memoryByCycle=[],startCreditsByCycle=[];
  while(!state.meta.endingUnlocked&&cycles<maxCycles){
    const era=state.meta.era;attempts[era]++;startCreditsByCycle.push(startingCredits(state));const memoryBefore=Number(state.meta.foundryMemory)||0;
    const out=playCycle(state,{mode,focusPolicy,speed:simSpeed,seed:(seed^Math.imul(cycles+1,0x45d9f3b))>>>0});cycles++;totalGameTime+=E.currentEra(state).duration;totalRealTime+=out.realSeconds;totalDecisions+=out.decisions;totalBuys+=out.buys;ratios[era].push(out.ratio);decisions[era]+=out.decisions;moduleRecoveries[era].push(out.moduleRecoveries);automationUpgrades[era].push(out.automationUpgrades);if(attempts[era]===1)firstAttemptWins[era]=!!state.cycle.result.win;
    memoryByCycle.push({cycle:cycles,era,memoryBefore,memoryEarned:out.memoryEarned,memoryAfter:Number(state.meta.foundryMemory)||0,researchData:out.researchData,win:!!state.cycle.result.win});
    const win=state.cycle.result.win;spendBlueprints(state);spendPatents(state);if(state.meta.endingUnlocked)break;state=E.restart(state,win&&E.canAdvanceEra(state));
  }
  const realMinutes=totalRealTime/60;
  return {seed,mode,focusPolicy,speed:simSpeed,finished:state.meta.endingUnlocked,cycles,totalGameTime,totalRealTime,totalDecisions,totalBuys,decisionsPerRealMinute:realMinutes>0?totalDecisions/realMinutes:0,buysPerRealMinute:realMinutes>0?totalBuys/realMinutes:0,attempts:attempts.slice(1),firstAttemptWins:firstAttemptWins.slice(1),ratios:ratios.slice(1),decisions:decisions.slice(1),moduleRecoveries:moduleRecoveries.slice(1),automationUpgrades:automationUpgrades.slice(1),memoryByCycle,startCreditsByCycle,foundryMemory:Number(state.meta.foundryMemory)||0,nextBreakthrough:nextBreakthrough(state.meta),upgrades:{...state.meta.upgrades},patentUpgrades:{...state.meta.patentUpgrades}};
}
function simulatePrestigeLoop(seed,{mode='attentive',era=3,maxCycles=12,focusPolicy='off',speed=1}={}){
  const simSpeed=normalizeSpeed(speed);let meta=E.baseMeta(seed);meta.era=era;meta.highestEra=Math.max(meta.highestEra,era);let state=E.createState(meta);const rows=[];
  for(let i=0;i<maxCycles;i++){
    const startMemory=Number(state.meta.foundryMemory)||0,startCredits=startingCredits(state),beforeBreakthroughs=P.unlocked(state.meta).map(x=>x.id);
    const out=playCycle(state,{mode,focusPolicy,speed:simSpeed,seed:(seed^Math.imul(i+1,0x27d4eb2d))>>>0});
    const afterMemory=Number(state.meta.foundryMemory)||0,afterBreakthroughs=P.unlocked(state.meta).map(x=>x.id);
    rows.push({cycle:i+1,era,speed:simSpeed,startMemory,startCredits,ratio:out.ratio,win:!!state.cycle.result.win,memoryEarned:out.memoryEarned,afterMemory,researchData:out.researchData,decisions:out.decisions,decisionsPerRealMinute:out.decisionsPerRealMinute,moduleRecoveries:out.moduleRecoveries,automationUpgrades:out.automationUpgrades,newBreakthroughs:afterBreakthroughs.filter(x=>!beforeBreakthroughs.includes(x))});
    state=E.restart(state,false);
  }
  return {seed,mode,era,focusPolicy,speed:simSpeed,rows,finalMemory:Number(state.meta.foundryMemory)||0};
}
function summarize(rows){
  const q=(a,p)=>{const v=[...a].filter(Number.isFinite).sort((x,y)=>x-y);return v.length?v[Math.floor((v.length-1)*p)]:0};
  const era=Array.from({length:7},(_,i)=>{const first=rows.filter(r=>r.firstAttemptWins[i]!=null),allRatios=rows.flatMap(r=>r.ratios[i]),modules=rows.flatMap(r=>r.moduleRecoveries?.[i]||[]),autos=rows.flatMap(r=>r.automationUpgrades?.[i]||[]);return {era:i+1,firstAttemptClear:first.length?first.filter(r=>r.firstAttemptWins[i]).length/first.length:null,attemptP50:q(rows.map(r=>r.attempts[i]),.5),attemptP90:q(rows.map(r=>r.attempts[i]),.9),ratioP50:q(allRatios,.5),ratioP10:q(allRatios,.1),moduleRecoveriesP50:q(modules,.5),automationUpgradesP50:q(autos,.5)}});
  const allMemory=rows.flatMap(r=>r.memoryByCycle||[]),firstFailureGains=[];
  for(const r of rows){const f=(r.memoryByCycle||[]).find(x=>!x.win&&x.memoryEarned>0);if(f)firstFailureGains.push(f.memoryEarned)}
  return {mode:rows[0]?.mode||'unknown',focusPolicy:rows[0]?.focusPolicy||'off',speed:rows[0]?.speed||1,finishRate:rows.length?rows.filter(r=>r.finished).length/rows.length:0,cyclesP50:q(rows.map(r=>r.cycles),.5),cyclesP90:q(rows.map(r=>r.cycles),.9),decisionsPerRealMinuteP50:q(rows.map(r=>r.decisionsPerRealMinute),.5),buysPerRealMinuteP50:q(rows.map(r=>r.buysPerRealMinute),.5),finalMemoryP50:q(rows.map(r=>r.foundryMemory||0),.5),firstMeaningfulFailureMemoryP50:q(firstFailureGains,.5),memoryPerCycleP50:q(allMemory.map(x=>x.memoryEarned),.5),era};
}
module.exports={MODES,SPEEDS,normalizeSpeed,decisionDelayGameSeconds,playCycle,simulateRoute,simulatePrestigeLoop,summarize,focusWanted};
if(require.main===module){
  const seeds=Math.max(6,Number(process.env.IF_HUMAN_SEEDS)||12),maxCycles=Math.max(10,Number(process.env.IF_HUMAN_MAX_CYCLES)||40),focusPolicies=(process.env.IF_HUMAN_FOCUS||'off,losing').split(',').map(x=>x.trim()).filter(Boolean),speeds=(process.env.IF_HUMAN_SPEEDS||'1').split(',').map(Number).filter(x=>SPEEDS.includes(x));
  for(const speed of speeds)for(const focusPolicy of focusPolicies)for(const mode of ['optimal','attentive','relaxed']){const rows=[];for(let i=1;i<=seeds;i++)rows.push(simulateRoute((0x7100000+i)>>>0,{mode,maxCycles,focusPolicy,speed}));console.log(JSON.stringify(summarize(rows),null,2))}
}
