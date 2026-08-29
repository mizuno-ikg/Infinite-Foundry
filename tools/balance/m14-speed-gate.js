'use strict';

const H=require('./human-proxy.js');

const DEFAULTS={
  seeds:12,
  maxCycles:40,
  modes:['attentive','relaxed'],
  focusPolicies:['off','losing'],
  speeds:[1,4,8],
  maxDensityRatio:1.8,
  minDensityRatio:0.45,
  maxCyclePenalty:1.25,
  maxFinishRateDrop:0.15,
  maxLateReachDrop:0.15,
  minX8UseRate:0.5
};

function median(values){
  const v=values.filter(Number.isFinite).sort((a,b)=>a-b);
  if(!v.length)return 0;
  return v[Math.floor((v.length-1)*0.5)];
}
function ratio(a,b){return b>0?a/b:(a>0?Infinity:1)}
function reachedAttempts(rows,index){return rows.map(r=>Number(r.attempts?.[index])||0).filter(x=>x>0)}
function reachedRate(rows,index){return rows.length?rows.filter(r=>(Number(r.attempts?.[index])||0)>0).length/rows.length:0}

function summarizeGroup(rows){
  const s=H.summarize(rows);
  return {
    ...s,
    x8UseRate:rows.length?rows.filter(r=>(r.speedByCycle||[]).includes(8)).length/rows.length:0,
    x8CyclesP50:median(rows.map(r=>(r.speedByCycle||[]).filter(x=>x===8).length)),
    lateAttemptsP50:[4,5,6].map(i=>median(reachedAttempts(rows,i))),
    lateReachedRate:[4,5,6].map(i=>reachedRate(rows,i))
  };
}

function evaluatePair(base,eight,opts={}){
  const cfg={...DEFAULTS,...opts};
  const densityRatio=ratio(eight.decisionsPerRealMinuteP50,base.decisionsPerRealMinuteP50);
  const buyDensityRatio=ratio(eight.buysPerRealMinuteP50,base.buysPerRealMinuteP50);
  const cycleRatio=ratio(eight.cyclesP50,base.cyclesP50);
  const finishRateDrop=base.finishRate-eight.finishRate;
  const lateReachDrops=(base.lateReachedRate||[1,1,1]).map((v,i)=>v-(eight.lateReachedRate||[1,1,1])[i]);
  const lateReachDrop=Math.max(...lateReachDrops);
  const checks={
    x8ActuallyUsed:eight.x8UseRate>=cfg.minX8UseRate&&eight.x8CyclesP50>0,
    decisionDensity:densityRatio>=cfg.minDensityRatio&&densityRatio<=cfg.maxDensityRatio,
    buyDensity:buyDensityRatio>=cfg.minDensityRatio&&buyDensityRatio<=cfg.maxDensityRatio,
    cyclePenalty:cycleRatio<=cfg.maxCyclePenalty,
    finishRate:finishRateDrop<=cfg.maxFinishRateDrop,
    lateReach:lateReachDrop<=cfg.maxLateReachDrop
  };
  return {
    pass:Object.values(checks).every(Boolean),
    checks,
    metrics:{densityRatio,buyDensityRatio,cycleRatio,finishRateDrop,lateReachDrop,lateReachDrops,x8UseRate:eight.x8UseRate,x8CyclesP50:eight.x8CyclesP50}
  };
}

function lateEraFit(summary){
  const [e5,e6,e7]=summary.lateAttemptsP50;
  const reached=summary.lateReachedRate||[1,1,1];
  return {
    pass:reached.every(x=>x>0)&&e5>=1&&e5<=4&&e6>=2&&e6<=6&&e7>=3&&e7<=8,
    attemptsP50:{era5:e5,era6:e6,era7:e7},
    reachedRate:{era5:reached[0],era6:reached[1],era7:reached[2]}
  };
}

function recommendationFrom(x8Pass,lateEraPass){return x8Pass&&lateEraPass?'KEEP_X8':'REMOVE_X8'}

function runGate(options={}){
  const cfg={...DEFAULTS,...options};
  const seedBase=Number(options.seedBase)||0x7140000;
  const groups=[];
  for(const mode of cfg.modes){
    for(const focusPolicy of cfg.focusPolicies){
      const bySpeed=new Map();
      for(const speed of cfg.speeds){
        const rows=[];
        for(let i=1;i<=cfg.seeds;i++)rows.push(H.simulateRoute((seedBase+i)>>>0,{mode,maxCycles:cfg.maxCycles,focusPolicy,speed}));
        bySpeed.set(speed,summarizeGroup(rows));
      }
      const base=bySpeed.get(4)||bySpeed.get(1);
      const eight=bySpeed.get(8);
      const gate=eight?evaluatePair(base,eight,cfg):{pass:false,checks:{missingX8:true},metrics:{}};
      groups.push({mode,focusPolicy,bySpeed:Object.fromEntries(bySpeed),gate,lateEra:eight?lateEraFit(eight):null});
    }
  }
  const x8Pass=groups.every(g=>g.gate.pass);
  const lateEraPass=groups.every(g=>!g.lateEra||g.lateEra.pass);
  return {
    config:{seeds:cfg.seeds,maxCycles:cfg.maxCycles,modes:cfg.modes,focusPolicies:cfg.focusPolicies,speeds:cfg.speeds},
    recommendation:recommendationFrom(x8Pass,lateEraPass),
    x8Pass,
    lateEraPass,
    groups
  };
}

module.exports={DEFAULTS,median,ratio,reachedAttempts,reachedRate,summarizeGroup,evaluatePair,lateEraFit,recommendationFrom,runGate};

if(require.main===module){
  const result=runGate({
    seeds:Math.max(6,Number(process.env.IF_M14_SEEDS)||DEFAULTS.seeds),
    maxCycles:Math.max(10,Number(process.env.IF_M14_MAX_CYCLES)||DEFAULTS.maxCycles),
    focusPolicies:(process.env.IF_M14_FOCUS||DEFAULTS.focusPolicies.join(',')).split(',').map(x=>x.trim()).filter(Boolean)
  });
  console.log(JSON.stringify(result,null,2));
  if(result.recommendation!=='KEEP_X8')process.exitCode=2;
}