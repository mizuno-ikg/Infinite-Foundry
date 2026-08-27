(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.InfiniteFoundryEraMechanics=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const PROTOCOLS={
    1:{name:'MANUAL DISCIPLINE',copy:'Learn the line. No special subsidy; identify and relieve the live bottleneck.',accent:'Baseline production doctrine.'},
    2:{name:'AUTONOMOUS RECLAIM',copy:'Upgrading the stage that was constraining the line recovers 8% of its cost.',accent:'Automation rewards correct diagnosis.'},
    3:{name:'LOGISTICS DIVIDEND',copy:'TRANSFER investment recovers 18% of upgrade cost as district logistics reuse.',accent:'The city pays for flow, not stockpiles.'},
    4:{name:'ORBITAL COUPLING',copy:'SOURCE and TRANSFER upgrades recover 12% when their levels remain within one step.',accent:'Surface extraction and orbit must rise together.'},
    5:{name:'THERMAL BANK',copy:'PROCESS or POWER upgrades store thermal charge. The next Overclock consumes one charge and lasts +2s.',accent:'A star rewards prepared bursts, not frantic clicking.'},
    6:{name:'LAW SYMMETRY',copy:'Any upgrade that leaves all five stage levels within a spread of two recovers 15% of its cost.',accent:'Stable laws emerge from balanced constants.'},
    7:{name:'GENESIS RESONANCE',copy:'Each new all-stage minimum level releases a genesis grant worth 12% of the final Directive target.',accent:'The new universe forms only when every layer advances.'}
  };
  const STORY={
    1:['Material flow registered. The line has a pulse.','Conversion noise resolves into a repeatable process.','For the first time, the workshop behaves like a machine.','A viable factory pattern has been proven.'],
    2:['Sensors assume intake control.','Servo loops begin correcting their own drift.','Human-speed intervention is no longer required.','The factory can reproduce its own operating discipline.'],
    3:['District feeders synchronize.','Freight stops belonging to individual buildings.','The skyline becomes one production graph.','The city is no longer around the factory. The city is the factory.'],
    4:['Continental extraction enters common cadence.','Orbital lift traffic clears continuous flow.','Surface and orbit behave as a single line.','A planet has been converted from habitat into machine.'],
    5:['Collector swarms bite into stellar output.','Thermal routing survives sustained capture.','The star becomes a controllable industrial input.','Stellar fire is now inventory.'],
    6:['Constants accept manufactured tolerances.','Causality remains coherent under load.','Independent laws lock into a stable lattice.','Physics has become an engineered component.'],
    7:['Prime matter stabilizes inside the frame.','Spacetime begins carrying its own production history.','Genesis layers enter mutual resonance.','Ignition criteria satisfied. A successor universe can begin.']
  };
  function eraId(state){return Math.max(1,Math.min(7,Number(state?.meta?.era)||1))}
  function protocolState(state){
    if(!state.cycle.protocol) state.cycle.protocol={thermalCharge:0,resonanceLevel:0};
    if(!Number.isFinite(state.cycle.protocol.thermalCharge)) state.cycle.protocol.thermalCharge=0;
    if(!Number.isFinite(state.cycle.protocol.resonanceLevel)) state.cycle.protocol.resonanceLevel=0;
    return state.cycle.protocol;
  }
  function levelSpread(state){let v=Object.values(state.cycle.levels);return Math.max(...v)-Math.min(...v)}
  function describe(state){
    const id=eraId(state),p=PROTOCOLS[id],ps=protocolState(state);
    let status=p.accent;
    if(id===4) status=`Coupling gap: ${Math.abs(state.cycle.levels.source-state.cycle.levels.transfer)} level(s).`;
    if(id===5) status=`Thermal charge: ${ps.thermalCharge} stored burst${ps.thermalCharge===1?'':'s'}.`;
    if(id===6) status=`Current law spread: ${levelSpread(state)} level(s).`;
    if(id===7) status=`Genesis resonance floor: LV ${Math.min(...Object.values(state.cycle.levels))}.`;
    return {...p,status,id};
  }
  function afterUpgrade(state,id,cost,wasBottleneck=false){
    const era=eraId(state),ps=protocolState(state);let rebate=0,message='';
    if(era===2&&wasBottleneck){rebate=cost*.08;message='AUTONOMOUS RECLAIM returned 8% of bottleneck investment.'}
    else if(era===3&&id==='transfer'){rebate=cost*.18;message='LOGISTICS DIVIDEND recovered district transfer cost.'}
    else if(era===4&&(id==='source'||id==='transfer')&&Math.abs(state.cycle.levels.source-state.cycle.levels.transfer)<=1){rebate=cost*.12;message='ORBITAL COUPLING recovered synchronized infrastructure cost.'}
    else if(era===5&&(id==='process'||id==='power')){ps.thermalCharge=Math.min(3,ps.thermalCharge+1);message='THERMAL BANK stored one Overclock extension.'}
    else if(era===6&&levelSpread(state)<=2){rebate=cost*.15;message='LAW SYMMETRY recovered balanced-constant investment.'}
    else if(era===7){let floor=Math.min(...Object.values(state.cycle.levels));if(floor>ps.resonanceLevel){let finalTarget=(rootSafeTargets(state)||[0,0,0,10800])[3];rebate=finalTarget*.12*(floor-ps.resonanceLevel);ps.resonanceLevel=floor;message='GENESIS RESONANCE released an all-layer production grant.'}}
    if(rebate>0)state.cycle.credits+=rebate;
    return {rebate,message};
  }
  function rootSafeTargets(state){
    if(typeof globalThis!=='undefined'&&globalThis.InfiniteFoundryEngine?.currentEra)return globalThis.InfiniteFoundryEngine.currentEra(state).targets;
    return null;
  }
  function afterPulse(state){
    if(eraId(state)!==5)return {extended:false,message:''};
    const ps=protocolState(state);if(ps.thermalCharge<=0)return {extended:false,message:''};
    ps.thermalCharge--;state.cycle.overclockUntil+=2;
    return {extended:true,message:'THERMAL BANK discharged: Overclock duration +2s.'};
  }
  function storyFor(state,index,clear){let text=(STORY[eraId(state)]||STORY[1])[index]||'';return clear?text:`Telemetry incomplete. ${text}`}
  return {PROTOCOLS,STORY,describe,afterUpgrade,afterPulse,storyFor,protocolState};
});
