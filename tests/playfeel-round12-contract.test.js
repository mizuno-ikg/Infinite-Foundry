'use strict';
const assert=require('assert'),fs=require('fs');
const E=require('../engine.js');
const L=require('../playfeel-logic.js');

const source=fs.readFileSync('playfeel-round12.js','utf8');
const round10=fs.readFileSync('playfeel-round10.js','utf8');
assert(round10.includes("round12.src='playfeel-round12.js'"),'Round 12 must be chained from the active playfeel loader');
assert(source.includes("overclock.addEventListener('click'"),'Round 12 must observe Overclock interaction');
assert(source.includes('if(spent||activated)'),'Only successful Overclock actions should trigger the durability save');
assert(source.includes('save();'),'Successful Overclock activation must persist immediately');

const meta=E.baseMeta(13579);let state=E.createState(meta);
let cap=L.ensureOverclockCapacitor(state);
assert.strictEqual(cap.charges,1,'new cycle starts with one capacitor charge');
assert(L.consumeOverclockCharge(state),'a capacitor charge should be consumable');
state.cycle.overclockUntil=8;
const restored=E.deserialize(E.serialize(state));
assert(restored,'serialized Overclock state should deserialize');
assert.strictEqual(restored.cycle.playfeel.overclockCapacitor.charges,0,'spent charge must survive reload');
assert.strictEqual(restored.cycle.overclockUntil,8,'active Overclock deadline must survive reload');
console.log('playfeel round12 contract: pass');
