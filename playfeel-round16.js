'use strict';
(()=>{
  const L=window.InfiniteFoundryPlayfeelLogic,E=window.InfiniteFoundryEngine;
  if(!L||!E||typeof L.upgradeOutcome!=='function')return;

  const baseUpgradeOutcome=L.upgradeOutcome.bind(L);
  L.upgradeOutcome=function(state,engine,id){
    const F=engine||E;
    if(!state||!F?.STAGE_DEFS?.[id])return baseUpgradeOutcome(state,F,id);
    const cost=F.cost(state,id);
    if(!F.canUpgrade(state,id)){
      const before=F.throughput(state);
      return {id,cost,before,after:before,gain:0,available:false};
    }
    return baseUpgradeOutcome(state,F,id);
  };

  const round17=document.createElement('script');round17.src='playfeel-round17.js';document.body.appendChild(round17);
})();