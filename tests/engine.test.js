const assert=require('assert');
const E=require('../engine.js');
assert.equal(E.VERSION,4);assert.equal(Object.keys(E.ERA_DEFS).length,7);assert.equal(E.currentEra(E.baseMeta(123)).id,1);
function runWithChunks(chunks){const s=E.createState(E.baseMeta(123456));for(const chunk of chunks)E.advance(s,chunk);return s}
const a=runWithChunks(Array(300).fill(1)),b=runWithChunks(Array(75).fill(4));assert(Math.abs(a.cycle.time-b.cycle.time)<1e-9);assert(Math.abs(a.cycle.credits-b.cycle.credits)<1e-6);assert.deepStrictEqual(a.cycle.modules.map(x=>x.id),b.cycle.modules.map(x=>x.id));
let s=E.createState(E.baseMeta(7));assert(E.upgrade(s,'source'));let loaded=E.deserialize(E.serialize(s));assert(loaded&&loaded.cycle.levels.source===1);E.advance(loaded,300);assert(loaded.cycle.ended&&loaded.cycle.result);assert(loaded.meta.blueprints>=2);let restarted=E.restart(loaded);assert.equal(restarted.meta.cycle,2);assert.equal(restarted.meta.blueprints,loaded.meta.blueprints);
let m=E.createState(E.baseMeta(8));m.meta.blueprints=8;assert(E.buyMetaUpgrade(m,'efficiency'));assert.equal(m.meta.upgrades.efficiency,1);
let old=E.createState(E.baseMeta(10));old.version=2;delete old.meta.patentUpgrades;delete old.meta.endingUnlocked;let migrated=E.deserialize(JSON.stringify({version:2,state:old}));assert(migrated);assert.deepStrictEqual(migrated.meta.patentUpgrades,{powerRouting:0,salvageTheory:0});assert.equal(migrated.meta.endingUnlocked,false);assert.equal(E.deserialize(JSON.stringify({version:E.VERSION+1,state:old})),null);
console.log('engine tests: ok');
