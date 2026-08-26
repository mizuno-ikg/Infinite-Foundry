const assert=require('assert');
const E=require('../engine.js');

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

let s=E.createState(E.baseMeta(7));
assert(E.upgrade(s,'source'),'stage upgrade succeeds when affordable');
const loaded=E.deserialize(E.serialize(s));
assert(loaded&&loaded.cycle.levels.source===1,'save roundtrip preserves stage level');
E.advance(loaded,300);
assert(loaded.cycle.ended&&loaded.cycle.result,'deadline resolves cycle');
assert(loaded.meta.blueprints>=2,'failure still grants salvage blueprints');
const beforeCycle=loaded.meta.cycle;
const restarted=E.restart(loaded);
assert.equal(restarted.meta.cycle,beforeCycle+1,'restart advances cycle number');
assert.equal(restarted.cycle.time,0,'restart resets run time');
assert.equal(restarted.meta.blueprints,loaded.meta.blueprints,'restart retains blueprints');

let meta=E.createState(E.baseMeta(8));
meta.meta.blueprints=8;
assert(E.buyMetaUpgrade(meta,'efficiency'),'blueprint purchase succeeds');
assert.equal(meta.meta.upgrades.efficiency,1,'permanent upgrade retained in meta');
assert.equal(meta.meta.blueprints,0,'blueprint cost deducted');

console.log('engine tests: ok');
