'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const E=require('../engine.js');

function snapshot(s){
  return {
    time:s.cycle.time,
    credits:s.cycle.credits,
    output:s.cycle.output,
    levels:{...s.cycle.levels},
    checkpointResults:s.cycle.checkpointResults,
    modules:s.cycle.modules,
    inventory:s.cycle.moduleInventory,
    rngState:s.cycle.rngState,
    ended:s.cycle.ended,
    result:s.cycle.result,
    events:s.cycle.events.map(e=>({time:e.time,type:e.type,stage:e.stage,level:e.level,index:e.index,clear:e.clear,moduleUid:e.moduleUid}))
  };
}
function runChunks(chunks){
  const meta=E.baseMeta(0x5148);meta.introSeen=true;meta.upgrades.automation=2;
  const s=E.createState(meta);
  for(const dt of chunks)E.advance(s,dt);
  return s;
}

// Large advancement chunks remain a determinism stress test even though x8 is
// no longer a selectable product speed.
const a=runChunks(Array(2400).fill(.05));
const b=runChunks(Array(120).fill(1));
const c=runChunks(Array(15).fill(8));
assert.deepStrictEqual(snapshot(b),snapshot(a),'1-second and fixed-step advancement must agree');
assert.deepStrictEqual(snapshot(c),snapshot(a),'8-game-second advancement chunks must not skip deterministic events');

const mid=runChunks(Array(8).fill(8));
const restored=E.deserialize(E.serialize(mid));
assert(restored,'serialized state should restore');
E.advance(mid,56);E.advance(restored,56);
assert.deepStrictEqual(snapshot(restored),snapshot(mid),'save/reload must not change future deterministic results');

const experimental=E.createState(E.baseMeta(0x814));
experimental.cycle.speed=8;
const normalized=E.deserialize(E.serialize(experimental));
assert(normalized,'experimental speed save should still load');
assert.strictEqual(normalized.cycle.speed,1,'unsupported experimental speed must normalize to the safe x1 baseline');

const m14=fs.readFileSync(path.join(__dirname,'..','m14-fast-forward.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
assert(m14.includes('ALLOWED_SPEEDS=[1,2,4]'),'shipping speed set must stop at x4');
assert(m14.includes('Engine.deserialize already normalizes')||m14.includes('Engine.deserialize already normalize'),'compatibility layer must document engine-owned invalid-speed normalization');
assert(m14.includes('x8Removed:true'),'browser compatibility layer must expose the M14 removal decision');
assert(!m14.includes("eightButton.dataset.speed='8'"),'browser layer must not create an x8 control');
assert(!m14.includes('requested===8?4'),'browser layer must not override the engine with a second x8 migration rule');
assert(!html.includes('data-speed="8"'),'shipping markup must not expose x8');
assert(html.includes('<script src="m14-fast-forward.js"></script>'),'shipping cleanup layer must remain loaded');
console.log('m14-fast-forward-contract: PASS');
