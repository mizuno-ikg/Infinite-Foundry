const assert=require('assert');
const E=require('../engine.js');

assert.equal(E.VERSION,3,'era foundation uses save schema v3');
assert.equal(Object.keys(E.ERA_DEFS).length,7,'all seven Version 1.0 eras are registered');
assert.equal(E.ERA_DEFS[1].name,'WORKSHOP','era I is Workshop');
assert.equal(E.ERA_DEFS[7].name,'UNIVERSE FOUNDRY','era VII is Universe Foundry');
assert.equal(E.currentEra(E.baseMeta(123)).id,1,'new games begin in era I');

function runWithChunks(chunks){
  const s=E.createState(E.baseMeta(123456));
  for(const chunk of chunks) E.advance(s,chunk);
  return s;
}

const oneSecond=runWithChunks(Array(300).fill(1));
const fourSecond=runWithChunks(Array(75).fill(4));
assert(Math.abs(oneSecond.cycle.time-fourSecond.cycle.time)<1e-9,'chunk/speed invariance: game time');
assert(Math.abs(oneSecond.cycle.credits-fourSecond.cycle.credits)<1e-6,'chunk/speed invariance: economy');
assert.deepStrictEqual(oneSecond.cycle.modules.map(x=>x.id),fourSecond.cycle.modules.map(x=>x.id),'seeded module sequence is deterministic');
assert.deepStrictEqual(oneSecond.cycle.events.filter(x=>x.type==='moduleRecovered').map(x=>x.moduleId),fourSecond.cycle.events.filter(x=>x.type==='moduleRecovered').map(x=>x.moduleId),'module domain events are deterministic');

let s=E.createState(E.baseMeta(7));
assert(E.upgrade(s,'source'),'stage upgrade succeeds when affordable');
const loaded=E.deserialize(E.serialize(s));
assert(loaded&&loaded.cycle.levels.source===1,'save roundtrip preserves stage level');
assert.equal(loaded.version,E.VERSION,'save roundtrip normalizes current version');
E.advance(loaded,300);
assert(loaded.cycle.ended&&loaded.cycle.result,'deadline resolves cycle');
assert(loaded.meta.blueprints>=2,'failure still grants salvage blueprints');
assert(loaded.cycle.events.some(x=>x.type==='directiveEvaluated'),'directive evaluation emits a domain event');
assert(loaded.cycle.events.some(x=>x.type==='cycleEnded'),'cycle ending emits a domain event');
const beforeCycle=loaded.meta.cycle;
const restarted=E.restart(loaded);
assert.equal(restarted.meta.cycle,beforeCycle+1,'restart advances cycle number');
assert.equal(restarted.cycle.time,0,'restart resets run time');
assert.equal(restarted.meta.blueprints,loaded.meta.blueprints,'restart retains blueprints');
assert(restarted.cycle.events.some(x=>x.type==='rebuild'),'restart emits rebuild event');

let meta=E.createState(E.baseMeta(8));
meta.meta.blueprints=8;
assert(E.buyMetaUpgrade(meta,'efficiency'),'blueprint purchase succeeds');
assert.equal(meta.meta.upgrades.efficiency,1,'permanent upgrade retained in meta');
assert.equal(meta.meta.blueprints,0,'blueprint cost deducted');
assert(meta.cycle.events.some(x=>x.type==='metaUpgrade'),'meta purchase emits domain event');

let autoMeta=E.baseMeta(9);
autoMeta.upgrades.automation=1;
let auto=E.createState(autoMeta);
auto.cycle.credits=100;
E.advance(auto,86);
assert(Object.values(auto.cycle.levels).some(x=>x>0),'automation memory performs conservative bottleneck upgrades after 75s');
assert(auto.cycle.events.some(x=>x.type==='automationUpgrade'),'automation memory emits an event for UI feedback');

let old=E.createState(E.baseMeta(10));
old.version=1;
delete old.meta.era;
delete old.meta.highestEra;
delete old.meta.patents;
delete old.meta.completedEras;
delete old.cycle.events;
delete old.cycle.nextEventSeq;
delete old.cycle.automationCheckAt;
const migrated=E.deserialize(JSON.stringify({version:1,savedAt:0,state:old}));
assert(migrated,'v1 save migrates instead of being discarded');
assert.equal(migrated.version,E.VERSION,'migrated save adopts current engine version');
assert(Array.isArray(migrated.cycle.events),'migration creates event buffer');
assert(Number.isFinite(migrated.cycle.automationCheckAt),'migration creates automation schedule');
assert.equal(migrated.meta.era,1,'pre-era save migrates to Workshop');
assert.equal(migrated.meta.highestEra,1,'pre-era save receives highest era');
assert.equal(migrated.meta.patents,0,'pre-era save receives Patent ledger');
assert.deepStrictEqual(migrated.meta.completedEras,[],'pre-era save receives completion ledger');

const future=E.deserialize(JSON.stringify({version:E.VERSION+1,state:old}));
assert.equal(future,null,'unknown future save version is rejected safely');

console.log('engine tests: ok');
