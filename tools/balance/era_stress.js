'use strict';
const E=require('../../engine.js');
globalThis.InfiniteFoundryEngine=E;
const M=require('../../era-mechanics.js');

const STAGES=Object.keys(E.STAGE_DEFS);
const SEEDS=Math.max(10,Number(process.env.IF_STRESS_SEEDS)||80);

function profileFor(era,seed,profile){
  const meta=E.baseMeta(seed);
  meta.era=era;meta.highestEra=era;meta.cycle=1;
  const p={
    fresh:{efficiency:0,capital:0,automation:0,moduleBay:0,powerRouting:0,salvageTheory:0},
    standard:{
      efficiency:Math.min(4,Math.max(1,Math.ceil(era/2))),
      capital:Math.min(3,Math.max(1,Math.floor((era+1)/2))),
      automation:Math.min(3,Math.max(0,era-2)),
      moduleBay:Math.min(2,Math.max(0,era-3)),
      powerRouting:Math.min(3,Math.max(0,era-2)),salvageTheory:0
    },
    max:{efficiency:4,capital:3,automation:3,moduleBay:2,powerRouting:3,salvageTheory:3}
  }[profile];
  meta.upgrades={efficiency:p.efficiency,capital:p.capital,automation:p.automation,moduleBay:p.moduleBay};
  meta.patentUpgrades={powerRouting:p.powerRouting,salvageTheory:p.salvageTheory};
  return meta;
}

function activePulse(state){
  if(!E.pulse(state))return;
  M.afterPulse(state);
}

function activeInvest(state){
  let guard=0;
  while(guard++<24&&!state.cycle.ended){
    const id=E.rawBottleneck(state),price=E.cost(state,id);
    if(!E.canUpgrade(state,id))break;
    const was=E.rawBottleneck(state)===id;
    if(!E.upgrade(state,id))break;
    M.afterUpgrade(state,id,price,was);
  }
}

function simulate(era,seed,profile){
  const state=E.createState(profileFor(era,seed,profile));
  let nextDecision=0;
  while(!state.cycle.ended){
    E.advance(state,Math.min(.5,E.currentEra(state).duration-state.cycle.time));
    if(state.cycle.ended)break;
    if(state.cycle.time+1e-9>=nextDecision){
      activePulse(state);activeInvest(state);nextDecision=state.cycle.time+1;
    }
  }
  return {
    win:state.cycle.result.win,
    average:state.cycle.result.average,
    checkpoints:state.cycle.checkpointResults.map(x=>x.value),
    levels:{...state.cycle.levels},modules:state.cycle.modules.length
  };
}

function quantile(values,p){
  const a=[...values].sort((x,y)=>x-y);
  return a[Math.floor((a.length-1)*p)];
}

function summarize(profile,era){
  const rows=[];
  for(let i=1;i<=SEEDS;i++)rows.push(simulate(era,(0xabc000+i)>>>0,profile));
  const final=rows.map(r=>r.average),checkpoints=[0,1,2].map(i=>rows.map(r=>r.checkpoints[i]||0));
  return {
    profile,era,seeds:SEEDS,target:E.ERA_DEFS[era].targets[3],clearRate:rows.filter(r=>r.win).length/rows.length,
    p10:quantile(final,.10),median:quantile(final,.50),p90:quantile(final,.90),
    checkpointMedian:checkpoints.map(x=>quantile(x,.50)),
    averageLevels:Object.fromEntries(STAGES.map(id=>[id,rows.reduce((a,r)=>a+r.levels[id],0)/rows.length]))
  };
}

const output=[];
for(const profile of ['fresh','standard','max'])for(let era=1;era<=7;era++)output.push(summarize(profile,era));
for(const r of output){
  console.log(`${r.profile.padEnd(8)} E${r.era} clear ${(r.clearRate*100).toFixed(0).padStart(3)}% | p10 ${r.p10.toFixed(1).padStart(9)} med ${r.median.toFixed(1).padStart(9)} p90 ${r.p90.toFixed(1).padStart(9)} | target ${String(r.target).padStart(7)} | cp50 ${r.checkpointMedian.map(x=>x.toFixed(0)).join('/')}`);
}
if(process.argv.includes('--json'))console.log(JSON.stringify(output,null,2));
