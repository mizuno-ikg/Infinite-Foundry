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

const a=runChunks(Array(2400).fill(.05));
const b=runChunks(Array(120).fill(1));
const c=runChunks(Array(15).fill(8));
assert.deepStrictEqual(snapshot(b),snapshot(a),'1-second and fixed-step advancement must agree');
assert.deepStrictEqual(snapshot(c),snapshot(a),'8-game-second fast-forward chunks must not skip deterministic events');

const mid=runChunks(Array(8).fill(8));
const restored=E.deserialize(E.serialize(mid));
assert(restored,'serialized state should restore');
E.advance(mid,56);E.advance(restored,56);
assert.deepStrictEqual(snapshot(restored),snapshot(mid),'save/reload must not change future deterministic results');

const m14=fs.readFileSync(path.join(__dirname,'..','m14-fast-forward.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
assert(m14.includes('ALLOWED_SPEEDS=[1,2,4,8]'),'M14 browser layer must explicitly allow x8');
assert(m14.includes("requested=Number(parsed?.state?.cycle?.speed)||1"),'x8 save restoration must preserve requested speed');
assert(html.includes('<script src="m14-fast-forward.js"></script>'),'M14 browser layer must be loaded by index.html');
assert(m14.includes("button.dataset.speed='8'"),'x8 speed control must be discoverable in the UI');
console.log('m14-fast-forward-contract: PASS');
