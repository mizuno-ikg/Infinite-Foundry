(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.InfiniteFoundryBalanceM10Logic=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function earlySalvageValue(state,E){
    if(!state?.cycle||state.cycle.ended||!E)return 0;
    const era=E.currentEra(state),final=E.directivesFor(state).at(-1);
    const timeRatio=Math.max(0,Math.min(1,(Number(state.cycle.time)||0)/era.duration));
    const progress=Math.max(0,Math.min(1,E.sustainedAverage(state,30)/final.target));
    const earnedFraction=Math.max(timeRatio,progress*.8);
    return Math.max(0,Math.floor(E.salvageBlueprints(state)*earnedFraction+1e-9));
  }
  return {earlySalvageValue};
});
