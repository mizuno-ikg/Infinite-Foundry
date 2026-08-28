(function(root,factory){
  if(typeof module==='object'&&module.exports) module.exports=factory;
  else root.InfiniteFoundryPrestigeM11=factory(root.InfiniteFoundryEngine);
})(typeof globalThis!=='undefined'?globalThis:this,function(E){
  'use strict';
  if(!E)return null;
  if(E.__prestigeM11Installed)return E.__prestigeM11Installed;

  const SCHEMA=1;
  const RESEARCH_MEANINGFUL_THRESHOLD=0.25;
  const BREAKTHROUGHS=[
    {id:'capital-I',threshold:12,name:'CAPITAL RECALL I'},
    {id:'automation-I',threshold:30,name:'AUTOMATION SCHEMATICS'},
    {id:'module-bay-I',threshold:60,name:'EXPANDED MODULE BAY'},
    {id:'efficiency-II',threshold:110,name:'DEEP PROCESS MEMORY'},
    {id:'capital-III',threshold:180,name:'RECURSIVE CAPITAL'}
  ];
  const original={
    baseMeta:E.baseMeta,createState:E.createState,advance:E.advance,restart:E.restart,
    deserialize:E.deserialize,serialize:E.serialize
  };

  function investedBlueprints(meta){
    let total=Math.max(0,Number(meta.blueprints)||0);
    for(const [id,costs] of Object.entries(E.UPGRADE_COSTS||{})){
      const lv=Math.max(0,Math.min(costs.length,Number(meta.upgrades?.[id])||0));
      for(let i=0;i<lv;i++)total+=costs[i];
    }
    return total;
  }
  function migrateMemory(meta){
    if(Number.isFinite(meta.foundryMemory)){
      meta.foundryMemory=Math.max(0,meta.foundryMemory);
      if(!Number.isFinite(meta.memorySchemaVersion))meta.memorySchemaVersion=SCHEMA;
      return meta;
    }
    const legacy=investedBlueprints(meta);
    const eraCredit=(Array.isArray(meta.completedEras)?meta.completedEras.length:0)*8;
    const successCredit=Math.max(0,Number(meta.successfulCycles)||0)*3;
    meta.foundryMemory=Math.max(0,Math.round(legacy*1.5+eraCredit+successCredit));
    meta.memorySchemaVersion=SCHEMA;
    meta.memoryMigratedFromLegacy=true;
    return meta;
  }
  function unlocked(meta){
    const m=Math.max(0,Number(meta?.foundryMemory)||0);
    return BREAKTHROUGHS.filter(x=>m>=x.threshold);
  }
  function continuousBonus(meta){
    const m=Math.max(0,Number(meta?.foundryMemory)||0);
    return Math.min(90,2*Math.sqrt(m)+0.22*m);
  }
  function applyBreakthroughFloors(meta){
    migrateMemory(meta);
    if(!meta.upgrades)meta.upgrades={};
    const ids=new Set(unlocked(meta).map(x=>x.id));
    if(ids.has('capital-I'))meta.upgrades.capital=Math.max(Number(meta.upgrades.capital)||0,1);
    if(ids.has('automation-I'))meta.upgrades.automation=Math.max(Number(meta.upgrades.automation)||0,1);
    if(ids.has('module-bay-I'))meta.upgrades.moduleBay=Math.max(Number(meta.upgrades.moduleBay)||0,1);
    if(ids.has('efficiency-II'))meta.upgrades.efficiency=Math.max(Number(meta.upgrades.efficiency)||0,2);
    if(ids.has('capital-III'))meta.upgrades.capital=Math.max(Number(meta.upgrades.capital)||0,3);
    return meta;
  }
  function applyCycleMemory(state){
    if(!state?.meta||!state?.cycle)return state;
    applyBreakthroughFloors(state.meta);
    if(!Number.isFinite(state.cycle.researchData))state.cycle.researchData=0;
    if(typeof state.cycle.researchFocus!=='boolean')state.cycle.researchFocus=false;
    if(typeof state.cycle.memoryAwarded!=='boolean')state.cycle.memoryAwarded=false;
    if(!state.cycle.memoryStartBonusApplied){
      const capital=Number(state.meta.upgrades?.capital)||0;
      const base=20+8*capital;
      const scale=base>0?state.cycle.credits/base:1;
      state.cycle.credits+=continuousBonus(state.meta)*Math.max(1,scale);
      state.cycle.memoryStartBonusApplied=true;
    }
    return state;
  }
  function meaningful(state){
    if(!state?.cycle)return false;
    const era=E.currentEra(state),duration=era.duration||1;
    const timeRatio=Math.max(0,state.cycle.time)/duration;
    const target=E.directivesFor(state).slice(-1)[0]?.target||1;
    const ratio=Math.max(0,Math.min(1,E.sustainedAverage(state,30)/target));
    const clears=(state.cycle.checkpointResults||[]).filter(x=>x.clear).length;
    const research=Math.max(0,Number(state.cycle.researchData)||0);
    return timeRatio>=0.08||ratio>=0.05||clears>0||research>=RESEARCH_MEANINGFUL_THRESHOLD;
  }
  function memoryEarned(state){
    if(!meaningful(state))return 0;
    const era=E.currentEra(state),target=E.directivesFor(state).slice(-1)[0]?.target||1;
    const ratio=Math.max(0,Math.min(1,E.sustainedAverage(state,30)/target));
    const clears=(state.cycle.checkpointResults||[]).filter(x=>x.clear).length;
    const research=Math.min(8,Math.floor(Math.max(0,Number(state.cycle.researchData)||0)));
    const win=state.cycle.result?.win?2:0;
    return 1+Math.floor(2*Math.sqrt(ratio))+clears+Math.floor(Math.max(0,era.id-1)/2)+research+win;
  }
  function awardMemory(state,opts={}){
    if(!state?.meta||!state?.cycle||state.cycle.memoryAwarded)return 0;
    migrateMemory(state.meta);
    const before=state.meta.foundryMemory;
    const beforeIds=new Set(unlocked(state.meta).map(x=>x.id));
    const earned=memoryEarned(state);
    state.meta.foundryMemory+=earned;
    state.cycle.memoryAwarded=true;
    const afterBreakthroughs=unlocked(state.meta);
    const newly=afterBreakthroughs.filter(x=>!beforeIds.has(x.id));
    if(!state.cycle.result)state.cycle.result={win:false,aborted:!!opts.aborted};
    state.cycle.result.memoryEarned=earned;
    state.cycle.result.memoryBefore=before;
    state.cycle.result.memoryAfter=state.meta.foundryMemory;
    state.cycle.result.newBreakthroughs=newly.map(x=>x.name);
    applyBreakthroughFloors(state.meta);
    return earned;
  }
  function memoryForecast(state){return memoryEarned(state)}
  function setResearchFocus(state,on){
    if(!state?.cycle||state.cycle.ended)return false;
    const next=!!on;
    if(state.cycle.researchFocus===next)return false;
    state.cycle.researchFocus=next;
    return true;
  }
  function researchFromProduction(state,produced){
    const target=E.directivesFor(state).slice(-1)[0]?.target||1;
    const diverted=Math.max(0,Number(produced)||0)*0.18;
    const unit=Math.max(1e-9,target*15*0.18);
    return {diverted,data:diverted/unit};
  }

  E.baseMeta=function(seed){const m=original.baseMeta(seed);m.foundryMemory=0;m.memorySchemaVersion=SCHEMA;return m};
  E.createState=function(meta){
    const copy=meta?JSON.parse(JSON.stringify(meta)):E.baseMeta(Date.now());
    applyBreakthroughFloors(copy);
    return applyCycleMemory(original.createState(copy));
  };
  E.advance=function(state,gameSeconds){
    applyCycleMemory(state);
    const wasEnded=!!state.cycle.ended,beforeOutput=Number(state.cycle.output)||0;
    const n=original.advance(state,gameSeconds);
    const produced=Math.max(0,(Number(state.cycle.output)||0)-beforeOutput);
    if(state.cycle.researchFocus&&produced>0){
      const research=researchFromProduction(state,produced);
      state.cycle.credits=Math.max(0,state.cycle.credits-research.diverted);
      state.cycle.researchData+=research.data;
    }
    if(!wasEnded&&state.cycle.ended)awardMemory(state);
    return n;
  };
  E.restart=function(state,advanceEra=false){
    migrateMemory(state.meta);applyBreakthroughFloors(state.meta);
    const next=original.restart(state,advanceEra);
    return applyCycleMemory(next);
  };
  E.deserialize=function(raw){
    const state=original.deserialize(raw);if(!state)return null;
    migrateMemory(state.meta);applyBreakthroughFloors(state.meta);return applyCycleMemory(state);
  };
  E.serialize=function(state){migrateMemory(state.meta);return original.serialize(state)};

  const api={SCHEMA,RESEARCH_MEANINGFUL_THRESHOLD,BREAKTHROUGHS,migrateMemory,unlocked,continuousBonus,applyBreakthroughFloors,memoryEarned,memoryForecast,awardMemory,setResearchFocus,researchFromProduction};
  E.__prestigeM11Installed=api;
  return api;
});