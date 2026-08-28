(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.InfiniteFoundryPlayfeelLogic=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const EPS=1e-9;
  const clone=x=>JSON.parse(JSON.stringify(x));
  const OVERCLOCK_CAPACITOR={maxCharges:3,rechargeSeconds:40,durationSeconds:8};
  const HOLD_TO_UPGRADE={delayMs:360,repeatMs:120};

  // Preview calculations run frequently in the live UI. Do not deep-clone the entire
  // save state (events, samples, inventory history, etc.) just to ask what throughput
  // would be after one hypothetical placement. Keep only fields used by capacity math.
  function previewState(state){
    return {
      version:state?.version,
      meta:clone(state?.meta||{}),
      cycle:{
        time:Number(state?.cycle?.time)||0,
        credits:Number(state?.cycle?.credits)||0,
        ended:!!state?.cycle?.ended,
        levels:{...(state?.cycle?.levels||{})},
        modules:(state?.cycle?.modules||[]).map(clone),
        overclockUntil:Number(state?.cycle?.overclockUntil)||0
      }
    };
  }

  function upgradeOutcome(state,E,id){
    if(!state||!E||!E.STAGE_DEFS?.[id])return null;
    const cost=E.cost(state,id),before=E.throughput(state),copy=previewState(state);
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
      const currentTp=E.throughput(state),copy=previewState(state);
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
    if(!state||!E||!uid||state?.cycle?.ended)return null;
    const bay=Number(bayIndex),slots=E.upgradeEffects(state.meta).moduleSlots;
    const m=state.cycle.moduleInventory?.find(x=>x?.uid===uid);
    if(!m||!Number.isInteger(bay)||bay<0||bay>=slots)return null;
    const before=E.throughput(state),from=state.cycle.modules.findIndex(x=>x?.uid===uid);
    if(from===bay)return {before,after:before,gain:0,changed:false,bay};
    const copy=previewState(state);
    while(copy.cycle.modules.length<slots)copy.cycle.modules.push(null);
    const displaced=copy.cycle.modules[bay]||null;
    copy.cycle.modules[bay]=clone(m);
    if(from>=0)copy.cycle.modules[from]=clone(displaced);
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

  function ensureOverclockCapacitor(state){
    if(!state?.cycle)return null;
    const now=Math.max(0,Number(state.cycle.time)||0);
    if(!state.cycle.playfeel)state.cycle.playfeel={};
    let cap=state.cycle.playfeel.overclockCapacitor;
    if(!cap||!Number.isFinite(Number(cap.charges))){
      cap={charges:1,maxCharges:OVERCLOCK_CAPACITOR.maxCharges,rechargeSeconds:OVERCLOCK_CAPACITOR.rechargeSeconds,progress:0,lastGameTime:now};
      state.cycle.playfeel.overclockCapacitor=cap;
    }
    cap.maxCharges=OVERCLOCK_CAPACITOR.maxCharges;
    cap.rechargeSeconds=OVERCLOCK_CAPACITOR.rechargeSeconds;
    cap.charges=Math.max(0,Math.min(cap.maxCharges,Math.floor(Number(cap.charges)||0)));
    cap.progress=Math.max(0,Number(cap.progress)||0);
    cap.lastGameTime=Number.isFinite(Number(cap.lastGameTime))?Math.min(now,Math.max(0,Number(cap.lastGameTime))):now;
    return cap;
  }

  function syncOverclockCapacitor(state){
    const cap=ensureOverclockCapacitor(state);if(!cap)return null;
    const now=Math.max(0,Number(state.cycle.time)||0),delta=Math.max(0,now-cap.lastGameTime);cap.lastGameTime=now;
    if(cap.charges>=cap.maxCharges){cap.progress=0;return cap}
    cap.progress+=delta;
    while(cap.progress+EPS>=cap.rechargeSeconds&&cap.charges<cap.maxCharges){cap.progress-=cap.rechargeSeconds;cap.charges++}
    if(cap.charges>=cap.maxCharges)cap.progress=0;
    return cap;
  }

  function consumeOverclockCharge(state){
    const cap=syncOverclockCapacitor(state);if(!cap||cap.charges<=0)return false;
    cap.charges--;return true;
  }

  function overclockReadout(state){
    const cap=syncOverclockCapacitor(state);if(!cap)return null;
    const active=Math.max(0,(Number(state.cycle.overclockUntil)||0)-(Number(state.cycle.time)||0));
    const next=cap.charges>=cap.maxCharges?0:Math.max(0,cap.rechargeSeconds-cap.progress);
    return {charges:cap.charges,maxCharges:cap.maxCharges,nextChargeIn:next,activeSeconds:active,durationSeconds:OVERCLOCK_CAPACITOR.durationSeconds,ready:cap.charges>0&&active<=EPS};
  }

  return {EPS,OVERCLOCK_CAPACITOR,HOLD_TO_UPGRADE,upgradeOutcome,reserveRatio,chooseAutomationUpgrade,repairAutoModuleSwaps,modulePlacementPreview,retainedKnowledgeSummary,ensureOverclockCapacitor,syncOverclockCapacitor,consumeOverclockCharge,overclockReadout};
});