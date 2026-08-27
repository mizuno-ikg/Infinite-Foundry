(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.InfiniteFoundryPlayfeelLogic=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const EPS=1e-9;
  const clone=x=>JSON.parse(JSON.stringify(x));

  function upgradeOutcome(state,E,id){
    if(!state||!E||!E.STAGE_DEFS?.[id])return null;
    const cost=E.cost(state,id),before=E.throughput(state),copy=clone(state);
    if(!E.canUpgrade(copy,id)||!E.upgrade(copy,id))return {id,cost,before,after:before,gain:0,available:false};
    const after=E.throughput(copy);
    return {id,cost,before,after,gain:after-before,available:true};
  }

  function reserveRatio(level,mode){
    const lv=Math.max(0,Number(level)||0);
    if(mode==='assist')return lv>=3?.30:lv>=2?.40:.50;
    if(mode==='smart')return lv>=3?.15:.30;
    return 1;
  }

  function chooseAutomationUpgrade(state,E,mode){
    const level=Number(state?.meta?.upgrades?.automation)||0;
    if(level<=0||!['assist','smart'].includes(mode)||state?.cycle?.ended)return null;
    const reserve=reserveRatio(level,mode),credits=Number(state.cycle.credits)||0;
    const canSpend=cost=>cost<=credits*(1-reserve)+EPS;
    const bottleneck=E.rawBottleneck(state);
    if(mode==='assist'){
      const out=upgradeOutcome(state,E,bottleneck);
      return out?.available&&canSpend(out.cost)?{...out,mode,reserve}:null;
    }
    const candidates=Object.keys(E.STAGE_DEFS).map(id=>upgradeOutcome(state,E,id)).filter(x=>x?.available&&canSpend(x.cost));
    if(!candidates.length)return null;
    candidates.sort((a,b)=>((b.gain>EPS?b.gain/b.cost:0)-(a.gain>EPS?a.gain/a.cost:0))||b.gain-a.gain||a.cost-b.cost);
    const positive=candidates.find(x=>x.gain>EPS);
    const chosen=positive||candidates.find(x=>x.id===bottleneck)||candidates[0];
    return {...chosen,mode,reserve};
  }

  function repairAutoModuleSwaps(state,E,sinceSeq=0){
    const repaired=[];
    if(!state?.cycle?.events||!state?.cycle?.moduleInventory)return repaired;
    for(const event of state.cycle.events){
      if((Number(event.seq)||0)<=sinceSeq||event.type!=='moduleRecovered'||event.action!=='replaced')continue;
      const bay=Number(event.bay);
      if(!Number.isInteger(bay)||bay<0||bay>=state.cycle.modules.length)continue;
      const current=state.cycle.modules[bay],old=state.cycle.moduleInventory.find(m=>m?.uid===event.replaced);
      if(!current||current.uid!==event.moduleUid||!old)continue;
      const currentTp=E.throughput(state),copy=clone(state);
      copy.cycle.modules[bay]=clone(old);
      const revertedTp=E.throughput(copy);
      if(revertedTp>currentTp+EPS){
        state.cycle.modules[bay]=clone(old);
        event.action='stored';
        event.autoRejected=true;
        event.autoRejectedReason='throughput-loss';
        event.autoRejectedFrom=currentTp;
        event.autoRejectedTo=revertedTp;
        event.bay=null;
        repaired.push({eventSeq:event.seq,moduleUid:event.moduleUid,revertedUid:old.uid,from:currentTp,to:revertedTp});
      }
    }
    return repaired;
  }

  function modulePlacementPreview(state,E,uid,bayIndex){
    if(!state||!E||!uid)return null;
    const bay=Number(bayIndex),before=E.throughput(state),copy=clone(state);
    if(!Number.isInteger(bay)||!E.equipModule(copy,uid,bay))return {before,after:before,gain:0,changed:false,bay};
    const after=E.throughput(copy);
    return {before,after,gain:after-before,changed:true,bay};
  }

  function retainedKnowledgeSummary(meta,E){
    if(!meta||!E)return null;
    const effects=E.upgradeEffects(meta),base=E.upgradeEffects(E.baseMeta(meta.seed||1));
    const capital=Number(meta.upgrades?.capital)||0,automation=Number(meta.upgrades?.automation)||0;
    return {
      capacity:effects.capacity,
      capacityBonus:effects.capacity-base.capacity,
      baseStartCredits:base.startCredits,
      startCredits:effects.startCredits,
      startCreditBonus:effects.startCredits-base.startCredits,
      moduleSlots:effects.moduleSlots,
      extraModuleSlots:effects.moduleSlots-base.moduleSlots,
      powerPatent:effects.powerPatent,
      powerBonus:effects.powerPatent-base.powerPatent,
      salvageBonus:effects.salvageBonus,
      automationLevel:automation,
      automationModes:automation<=0?['OFF']:automation===1?['OFF','ASSIST']:['OFF','ASSIST','SMART'],
      capitalLevel:capital
    };
  }

  return {EPS,upgradeOutcome,reserveRatio,chooseAutomationUpgrade,repairAutoModuleSwaps,modulePlacementPreview,retainedKnowledgeSummary};
});