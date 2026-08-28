(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.InfiniteFoundryEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION=5, STEP=0.05;
  const ERA_DEFS={
    1:{id:1,key:'workshop',name:'WORKSHOP',site:'Ember Bay',theme:'ember',duration:150,focus:'Foundational bottlenecks',directive:'FORGE A VIABLE LINE',targets:[2.5,5,7,9],stageBias:{},rewardPatents:1},
    2:{id:2,key:'automated-factory',name:'AUTOMATED FACTORY',site:'Servo District',theme:'electric',duration:165,focus:'Power, automation, module builds',directive:'SUSTAIN AUTONOMOUS OUTPUT',targets:[7,14,21,27],stageBias:{power:0.78,transfer:0.90},rewardPatents:1},
    3:{id:3,key:'industrial-city',name:'INDUSTRIAL CITY',site:'Iron Meridian',theme:'city',duration:180,focus:'District logistics',directive:'FEED THE INDUSTRIAL GRID',targets:[27,54,81,108],stageBias:{transfer:0.72,assembly:0.88},rewardPatents:1},
    4:{id:4,key:'planetary-foundry',name:'PLANETARY FOUNDRY',site:'Atlas Crustworks',theme:'planet',duration:195,focus:'Continental supply and orbit',directive:'INDUSTRIALIZE THE PLANET',targets:[97.5,195,292.5,390],stageBias:{source:0.76,transfer:0.82},rewardPatents:1},
    5:{id:5,key:'stellar-forge',name:'STELLAR FORGE',site:'Helios Crown',theme:'stellar',duration:210,focus:'Energy capture and thermal stability',directive:'HARNESS A STAR',targets:[362.5,725,1087.5,1450],stageBias:{power:0.62,process:0.82},rewardPatents:1},
    6:{id:6,key:'law-foundry',name:'LAW FOUNDRY',site:'Causality Lattice',theme:'law',duration:225,focus:'Interdependent physical constants',directive:'FABRICATE STABLE LAW',targets:[1050,2100,3150,4200],stageBias:{process:0.74,assembly:0.78,power:0.82},rewardPatents:1},
    7:{id:7,key:'universe-foundry',name:'UNIVERSE FOUNDRY',site:'Genesis Frame',theme:'universe',duration:240,focus:'Final integration and universe ignition',directive:'IGNITE A NEW UNIVERSE',targets:[2950,5900,8850,11800],stageBias:{source:0.84,process:0.80,transfer:0.82,assembly:0.76,power:0.78},rewardPatents:1}
  };
  const STAGE_DEFS={
    source:{name:'SOURCE',base:1.2,cost:8,costGrowth:1.18,growth:1.11},
    process:{name:'PROCESS',base:1,cost:9,costGrowth:1.18,growth:1.11},
    transfer:{name:'TRANSFER',base:.9,cost:10,costGrowth:1.18,growth:1.11},
    assembly:{name:'ASSEMBLY',base:.8,cost:11,costGrowth:1.18,growth:1.11},
    power:{name:'POWER',base:6,cost:10,costGrowth:1.20,growth:1.18}
  };
  const MODULES=[
    {id:'bearings',name:'Refined Bearings',rarity:'COMMON',min:.04,max:.08},
    {id:'thermal',name:'Thermal Recirculator',rarity:'REFINED',min:.08,max:.15},
    {id:'servo',name:'Prototype Servo Grid',rarity:'PROTOTYPE',min:.18,max:.30}
  ];
  const UPGRADE_COSTS={efficiency:[8,18,36,70],capital:[6,16,34],automation:[10,24,50],moduleBay:[14,38]};
  const PATENT_UPGRADES={
    powerRouting:{name:'POWER ROUTING',desc:'POWER capacity +12% / patent level',max:3},
    salvageTheory:{name:'SALVAGE THEORY',desc:'Blueprint salvage +1 / patent level',max:3}
  };

  function xorshift32(seed){let x=(seed>>>0)||0x9e3779b9;return function(){x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296}}
  function hashSeed(seed,cycle,era=1){let x=(seed>>>0)^(Math.imul(cycle+1,0x9e3779b1)>>>0)^(Math.imul(era,0x85ebca6b)>>>0);x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;return x>>>0}
  function baseMeta(seed){return {blueprints:0,patents:0,cycle:1,era:1,highestEra:1,completedEras:[],seed:(seed>>>0)||0x13579bdf,upgrades:{efficiency:0,capital:0,automation:0,moduleBay:0},patentUpgrades:{powerRouting:0,salvageTheory:0},discoveredModules:[],bestThroughput:0,totalOutput:0,successfulCycles:0,endingUnlocked:false,introSeen:false}}
  function currentEra(stateOrMeta){let m=stateOrMeta&&stateOrMeta.meta?stateOrMeta.meta:stateOrMeta||{};return ERA_DEFS[Math.max(1,Math.min(7,Number(m.era)||1))]||ERA_DEFS[1]}
  function directivesFor(stateOrMeta){let era=currentEra(stateOrMeta),d=era.duration;return [0.25,0.5,0.75,1].map((f,i)=>({t:d*f,target:era.targets[i],label:i===3?'FINAL DIRECTIVE':['INTAKE STABLE','SYSTEM COHERENT','LINE SYNCHRONIZED'][i]}))}
  function upgradeEffects(meta){return {capacity:1+0.08*meta.upgrades.efficiency,startCredits:20+8*meta.upgrades.capital,moduleSlots:2+meta.upgrades.moduleBay,autoBudget:meta.upgrades.automation,powerPatent:1+0.12*(meta.patentUpgrades?.powerRouting||0),salvageBonus:(meta.patentUpgrades?.salvageTheory||0)}}
  function eraScale(meta){return Math.pow(2.45,Math.max(0,(meta.era||1)-1))}
  function cloneModule(m){return m?{...m}:null}

  function createState(meta){
    meta=meta?JSON.parse(JSON.stringify(meta)):baseMeta(Date.now());
    normalizeMeta(meta);
    let e=upgradeEffects(meta);
    let state={version:VERSION,meta,cycle:{time:0,accumulator:0,credits:e.startCredits*eraScale(meta),levels:{source:0,process:0,transfer:0,assembly:0,power:0},speed:1,overclockUntil:0,overclockReady:0,nextModuleAt:0,modulePityAt:0,modules:Array(e.moduleSlots).fill(null),moduleInventory:[],nextModuleSerial:1,throughputSamples:[],output:0,ended:false,result:null,checkpointResults:[],lastCheckpointIndex:-1,rngState:hashSeed(meta.seed,meta.cycle,meta.era),events:[],nextEventSeq:1,automationCheckAt:Math.max(30,currentEra(meta).duration*.18)}};
    emitEvent(state,'cycleStarted',{cycle:meta.cycle,era:meta.era});
    return state;
  }
  function emitEvent(state,type,data={}){let e={seq:state.cycle.nextEventSeq++,time:state.cycle.time,type,...data};state.cycle.events.push(e);while(state.cycle.events.length>64)state.cycle.events.shift();return e}
  function rngFor(state){let r=xorshift32(state.cycle.rngState),v=r();state.cycle.rngState=Math.floor(r()*4294967295)>>>0;return v}
  function moduleMultiplier(state,id){return state.cycle.modules.reduce((mult,x)=>x&&x.target===id?mult*x.mult:mult,1)}
  function growthSeries(growth,levels){return levels<=0?1:(Math.pow(growth,levels)-1)/(growth-1)+1}
  function stageCapacityNoModule(state,id){let d=STAGE_DEFS[id],e=upgradeEffects(state.meta),era=currentEra(state),bias=era.stageBias[id]||1,v=d.base*growthSeries(d.growth,state.cycle.levels[id])*e.capacity*eraScale(state.meta)*bias;if(id==='power')v*=e.powerPatent;return v}
  function rawBottleneck(state){let best='source',v=Infinity;for(let id of Object.keys(STAGE_DEFS)){let c=stageCapacityNoModule(state,id)*moduleMultiplier(state,id);if(c<v-1e-9){v=c;best=id}}return best}
  function stageCapacity(state,id,includeOverclock=true){let v=stageCapacityNoModule(state,id)*moduleMultiplier(state,id);if(includeOverclock&&id===rawBottleneck(state)&&state.cycle.time<state.cycle.overclockUntil)v*=1.3;return v}
  function throughput(state){return Math.min(...Object.keys(STAGE_DEFS).map(id=>stageCapacity(state,id,true)))}
  function cost(state,id){let d=STAGE_DEFS[id];return d.cost*Math.pow(d.costGrowth,state.cycle.levels[id])*eraScale(state.meta)}
  function canUpgrade(state,id){return !state.cycle.ended&&state.cycle.credits+1e-9>=cost(state,id)}
  function upgrade(state,id){if(!STAGE_DEFS[id]||!canUpgrade(state,id))return false;state.cycle.credits-=cost(state,id);state.cycle.levels[id]++;return true}
  function pulse(state){if(state.cycle.ended||state.cycle.time+1e-9<state.cycle.overclockReady)return false;let target=rawBottleneck(state);state.cycle.overclockUntil=state.cycle.time+4;state.cycle.overclockReady=state.cycle.time+12;emitEvent(state,'overclock',{stage:target});return true}
  function scheduleFirstModule(state){if(state.cycle.nextModuleAt>0)return;let era=currentEra(state);state.cycle.nextModuleAt=era.duration*(.10+rngFor(state)*.08);state.cycle.modulePityAt=era.duration*.34}
  function bestAutomaticModulePlacement(state,m){
    const slots=upgradeEffects(state.meta).moduleSlots;
    while(state.cycle.modules.length<slots)state.cycle.modules.push(null);
    const empty=state.cycle.modules.findIndex(x=>!x);
    if(empty>=0)return {bay:empty,improves:true};
    let weakest=0;
    for(let i=1;i<slots;i++)if((state.cycle.modules[i]?.mult||0)<(state.cycle.modules[weakest]?.mult||0))weakest=i;
    return {bay:m.mult>(state.cycle.modules[weakest]?.mult||0)+1e-9?weakest:-1,improves:m.mult>(state.cycle.modules[weakest]?.mult||0)+1e-9};
  }
  function drawModule(state){
    let r=rngFor(state),template=r<.70?MODULES[0]:r<.94?MODULES[1]:MODULES[2],boost=template.min+rngFor(state)*(template.max-template.min),targets=['source','process','transfer','assembly','power'],target=targets[Math.floor(rngFor(state)*targets.length)];
    const uid=`C${state.meta.cycle}-M${state.cycle.nextModuleSerial++}`;
    let m={...template,uid,mult:1+boost,target,effect:`${STAGE_DEFS[target].name} +${(boost*100).toFixed(1)}%`};
    state.cycle.moduleInventory.push(cloneModule(m));
    const placement=bestAutomaticModulePlacement(state,m);let action='stored',replaced=null,replacedName=null,bay=null;
    if(placement.improves){
      bay=placement.bay;const old=state.cycle.modules[bay];
      if(old){replaced=old.uid;replacedName=old.name;action='replaced'}else action='equipped';
      state.cycle.modules[bay]=cloneModule(m);
    }
    if(!state.meta.discoveredModules.includes(m.id))state.meta.discoveredModules.push(m.id);
    state.cycle.nextModuleAt=state.cycle.time+currentEra(state).duration*(.12+rngFor(state)*.10);state.cycle.modulePityAt=state.cycle.time+currentEra(state).duration*.36;
    emitEvent(state,'moduleRecovered',{moduleUid:m.uid,moduleId:m.id,name:m.name,rarity:m.rarity,effect:m.effect,target:m.target,action,bay,replaced,replacedName});
    return m;
  }
  function equipModule(state,uid,bayIndex){
    if(state.cycle.ended)return false;
    const slots=upgradeEffects(state.meta).moduleSlots,bay=Number(bayIndex);
    if(!Number.isInteger(bay)||bay<0||bay>=slots)return false;
    const m=state.cycle.moduleInventory.find(x=>x&&x.uid===uid);if(!m)return false;
    while(state.cycle.modules.length<slots)state.cycle.modules.push(null);
    const from=state.cycle.modules.findIndex(x=>x&&x.uid===uid);
    if(from===bay)return false;
    const displaced=state.cycle.modules[bay]||null;
    state.cycle.modules[bay]=cloneModule(m);
    if(from>=0)state.cycle.modules[from]=cloneModule(displaced);
    emitEvent(state,'moduleEquipped',{moduleUid:m.uid,name:m.name,effect:m.effect,bay,from:from>=0?from:null,displaced:displaced?.uid||null});
    return true;
  }
  function sustainedAverage(state,seconds=30){let cutoff=Math.max(0,state.cycle.time-seconds),s=state.cycle.throughputSamples.filter(x=>x.t>=cutoff);if(!s.length)return throughput(state);let weighted=0,total=0;for(let i=1;i<s.length;i++){let dt=s[i].t-s[i-1].t;weighted+=s[i-1].v*dt;total+=dt}return total>0?weighted/total:s[s.length-1].v}
  function salvageBlueprints(state){let dirs=directivesFor(state),cleared=state.cycle.checkpointResults.filter(x=>x.clear).length,ratio=Math.min(1,sustainedAverage(state,30)/dirs[3].target),eraBonus=Math.max(0,currentEra(state).id-1),e=upgradeEffects(state.meta);return 2+2*cleared+Math.floor(3*Math.sqrt(Math.max(0,ratio)))+eraBonus+e.salvageBonus}
  function evaluateCheckpoints(state){let dirs=directivesFor(state);while(state.cycle.lastCheckpointIndex+1<dirs.length&&state.cycle.time+1e-9>=dirs[state.cycle.lastCheckpointIndex+1].t){let i=++state.cycle.lastCheckpointIndex,d=dirs[i],v=i===dirs.length-1?sustainedAverage(state,30):throughput(state),clear=v+1e-9>=d.target;state.cycle.checkpointResults.push({index:i,time:d.t,target:d.target,value:v,clear});emitEvent(state,'directiveEvaluated',{index:i,label:d.label,target:d.target,value:v,clear})}}
  function runAutomation(state){let lv=state.meta.upgrades.automation;if(lv<=0||state.cycle.ended)return;while(state.cycle.time+1e-9>=state.cycle.automationCheckAt){let threshold=[Infinity,1.8,1.5,1.3][Math.min(3,lv)]||1.3,id=rawBottleneck(state),c=cost(state,id);if(state.cycle.credits+1e-9>=c*threshold&&upgrade(state,id))emitEvent(state,'automationUpgrade',{stage:id,level:state.cycle.levels[id],cost:c});state.cycle.automationCheckAt+=Math.max(8,currentEra(state).duration*.05)}}
  function finishCycle(state){if(state.cycle.ended)return;let dirs=directivesFor(state),avg=sustainedAverage(state,30),win=avg+1e-9>=dirs[3].target,bp=salvageBlueprints(state);state.cycle.ended=true;state.cycle.result={win,average:avg,blueprintsEarned:bp,eraCompleted:false,patentsEarned:0,finalBottleneck:rawBottleneck(state)};state.meta.blueprints+=bp;state.meta.bestThroughput=Math.max(state.meta.bestThroughput,avg);state.meta.totalOutput+=state.cycle.output;if(win){state.meta.successfulCycles++;let era=currentEra(state);if(!state.meta.completedEras.includes(era.id)){state.meta.completedEras.push(era.id);state.meta.patents+=era.rewardPatents;state.cycle.result.eraCompleted=true;state.cycle.result.patentsEarned=era.rewardPatents;emitEvent(state,'eraCompleted',{era:era.id,patentsEarned:era.rewardPatents});if(era.id===7)state.meta.endingUnlocked=true}}emitEvent(state,'cycleEnded',{win,average:avg,blueprintsEarned:bp,era:state.meta.era,finalBottleneck:state.cycle.result.finalBottleneck})}
  function step(state,dt=STEP){if(state.cycle.ended)return;scheduleFirstModule(state);let deadline=currentEra(state).duration,end=Math.min(deadline,state.cycle.time+dt),actual=end-state.cycle.time;if(actual<=0){finishCycle(state);return}let tp=throughput(state);state.cycle.credits+=tp*actual;state.cycle.output+=tp*actual;state.cycle.time=end;state.cycle.throughputSamples.push({t:state.cycle.time,v:tp});while(state.cycle.throughputSamples.length>1000)state.cycle.throughputSamples.shift();if(state.cycle.time+1e-9>=state.cycle.nextModuleAt||state.cycle.time+1e-9>=state.cycle.modulePityAt)drawModule(state);runAutomation(state);evaluateCheckpoints(state);if(state.cycle.time+1e-9>=deadline)finishCycle(state)}
  function advance(state,gameSeconds){let total=state.cycle.accumulator+Math.max(0,gameSeconds),n=Math.floor(total/STEP+1e-9);state.cycle.accumulator=total-n*STEP;for(let i=0;i<n&&!state.cycle.ended;i++)step(state,STEP);return n}
  function buyMetaUpgrade(state,id){let arr=UPGRADE_COSTS[id],lv=state.meta.upgrades[id];if(!arr||lv>=arr.length)return false;let c=arr[lv];if(state.meta.blueprints<c)return false;state.meta.blueprints-=c;state.meta.upgrades[id]++;emitEvent(state,'metaUpgrade',{upgrade:id,level:state.meta.upgrades[id],cost:c});return true}
  function buyPatentUpgrade(state,id){let d=PATENT_UPGRADES[id],lv=state.meta.patentUpgrades[id]||0;if(!d||lv>=d.max||state.meta.patents<1)return false;state.meta.patents--;state.meta.patentUpgrades[id]=lv+1;emitEvent(state,'patentUpgrade',{upgrade:id,level:lv+1,cost:1});return true}
  function canAdvanceEra(state){return !!(state.cycle.ended&&state.cycle.result?.win&&state.meta.completedEras.includes(state.meta.era)&&state.meta.era<7)}
  function restart(state,advanceEra=false){let meta=JSON.parse(JSON.stringify(state.meta));meta.cycle++;if(advanceEra&&canAdvanceEra(state)){meta.era++;meta.highestEra=Math.max(meta.highestEra,meta.era)}let next=createState(meta);emitEvent(next,advanceEra?'eraAdvanced':'rebuild',{cycle:meta.cycle,era:meta.era});return next}
  function serialize(state){return JSON.stringify({version:VERSION,savedAt:Date.now(),state})}

  function normalizeMeta(m){
    if(!Number.isFinite(m.cycle))m.cycle=1;if(!Number.isFinite(m.era))m.era=1;if(!Number.isFinite(m.highestEra))m.highestEra=m.era;if(!Number.isFinite(m.blueprints))m.blueprints=0;if(!Number.isFinite(m.patents))m.patents=0;
    if(!Array.isArray(m.completedEras))m.completedEras=[];if(!Array.isArray(m.discoveredModules))m.discoveredModules=[];
    if(!m.upgrades)m.upgrades={};for(const id of Object.keys(UPGRADE_COSTS))if(!Number.isFinite(m.upgrades[id]))m.upgrades[id]=0;
    if(!m.patentUpgrades)m.patentUpgrades={};for(let id of Object.keys(PATENT_UPGRADES))if(!Number.isFinite(m.patentUpgrades[id]))m.patentUpgrades[id]=0;
    if(typeof m.endingUnlocked!=='boolean')m.endingUnlocked=false;
    if(!Number.isFinite(m.bestThroughput))m.bestThroughput=0;if(!Number.isFinite(m.totalOutput))m.totalOutput=0;if(!Number.isFinite(m.successfulCycles))m.successfulCycles=0;
    return m;
  }
  function normalizeState(s){
    if(!s||!s.meta||!s.cycle)return null;
    const hadIntro=typeof s.meta.introSeen==='boolean';
    s.version=VERSION;normalizeMeta(s.meta);
    if(!hadIntro)s.meta.introSeen=!!(s.meta.cycle>1||Number(s.cycle.time)>0||s.cycle.ended);
    const c=s.cycle;c.accumulator=0;
    if(!c.levels)c.levels={};for(const id of Object.keys(STAGE_DEFS))if(!Number.isFinite(c.levels[id]))c.levels[id]=0;
    if(!Array.isArray(c.throughputSamples))c.throughputSamples=[];if(!Array.isArray(c.checkpointResults))c.checkpointResults=[];
    if(!Array.isArray(c.events))c.events=[];let maxSeq=c.events.reduce((m,e)=>Math.max(m,Number(e.seq)||0),0);c.nextEventSeq=Math.max(Number(c.nextEventSeq)||1,maxSeq+1);
    if(!Number.isFinite(c.automationCheckAt))c.automationCheckAt=Math.max(30,currentEra(s).duration*.18);if(!Number.isFinite(c.rngState))c.rngState=hashSeed(s.meta.seed,s.meta.cycle,s.meta.era);
    if(!Array.isArray(c.modules))c.modules=[];
    let serial=1;
    c.modules=c.modules.map((m,i)=>{if(!m)return null;const out={...m};if(!out.uid)out.uid=`C${s.meta.cycle}-L${i+1}`;serial=Math.max(serial,i+2);return out});
    if(!Array.isArray(c.moduleInventory))c.moduleInventory=c.modules.filter(Boolean).map(cloneModule);
    else c.moduleInventory=c.moduleInventory.filter(Boolean).map((m,i)=>{const out={...m};if(!out.uid)out.uid=`C${s.meta.cycle}-I${i+1}`;return out});
    const invIds=new Set(c.moduleInventory.map(m=>m.uid));for(const m of c.modules.filter(Boolean))if(!invIds.has(m.uid)){c.moduleInventory.push(cloneModule(m));invIds.add(m.uid)}
    serial=Math.max(serial,Number(c.nextModuleSerial)||1,c.moduleInventory.length+1);c.nextModuleSerial=serial;
    const slots=upgradeEffects(s.meta).moduleSlots;if(c.modules.length>slots)c.modules=c.modules.slice(0,slots);while(c.modules.length<slots)c.modules.push(null);
    if(!Number.isFinite(c.speed)||![1,2,4].includes(Number(c.speed)))c.speed=1;
    return s;
  }
  function deserialize(raw){try{let p=typeof raw==='string'?JSON.parse(raw):raw;if(!p||!p.state||!Number.isFinite(Number(p.version))||Number(p.version)>VERSION)return null;return normalizeState(p.state)}catch(e){return null}}

  return {VERSION,STEP,ERA_DEFS,STAGE_DEFS,MODULES,UPGRADE_COSTS,PATENT_UPGRADES,baseMeta,currentEra,directivesFor,createState,upgradeEffects,stageCapacity,rawBottleneck,moduleMultiplier,throughput,cost,canUpgrade,upgrade,pulse,equipModule,sustainedAverage,salvageBlueprints,advance,buyMetaUpgrade,buyPatentUpgrade,canAdvanceEra,restart,serialize,deserialize};
});