'use strict';
(()=>{
  const L=window.InfiniteFoundryPlayfeelLogic,E=window.InfiniteFoundryEngine;
  if(!L||!E||typeof L.upgradeOutcome!=='function'||typeof L.modulePlacementPreview!=='function')return;

  const baseUpgradeOutcome=L.upgradeOutcome.bind(L);
  const baseModulePreview=L.modulePlacementPreview.bind(L);
  const upgradeCache=new Map(),moduleCache=new Map();
  const ids=['source','process','transfer','assembly','power'];

  function structuralSignature(s){
    if(!s?.meta||!s?.cycle)return 'invalid';
    const m=s.meta,c=s.cycle,u=m.upgrades||{},p=m.patentUpgrades||{};
    const levels=ids.map(id=>Number(c.levels?.[id])||0).join(',');
    const modules=(c.modules||[]).map(x=>x?`${x.uid||x.id}:${x.target}:${Number(x.mult)||1}`:'-').join('|');
    const overclockActive=(Number(c.time)||0)<(Number(c.overclockUntil)||0)?1:0;
    return `${Number(m.era)||1};${Number(u.efficiency)||0};${Number(u.moduleBay)||0};${Number(p.powerRouting)||0};${c.ended?1:0};${overclockActive};${levels};${modules}`;
  }

  L.upgradeOutcome=function(state,engine,id){
    const F=engine||E;
    if(!state||!F?.STAGE_DEFS?.[id])return baseUpgradeOutcome(state,F,id);
    if(!F.canUpgrade(state,id))return baseUpgradeOutcome(state,F,id);
    const key=`${id};${structuralSignature(state)}`;
    if(upgradeCache.has(key))return {...upgradeCache.get(key)};
    const out=baseUpgradeOutcome(state,F,id);
    if(upgradeCache.size>32)upgradeCache.clear();
    upgradeCache.set(key,{...out});
    return out;
  };

  L.modulePlacementPreview=function(state,engine,uid,bayIndex){
    const F=engine||E;
    if(!state||!uid)return baseModulePreview(state,F,uid,bayIndex);
    const key=`${uid};${Number(bayIndex)};${structuralSignature(state)}`;
    if(moduleCache.has(key))return {...moduleCache.get(key)};
    const out=baseModulePreview(state,F,uid,bayIndex);
    if(moduleCache.size>48)moduleCache.clear();
    moduleCache.set(key,{...out});
    return out;
  };

  if(typeof document!=='undefined'){
    const next=document.createElement('script');
    next.src='playfeel-round18.js';
    document.head.append(next);
  }
})();
