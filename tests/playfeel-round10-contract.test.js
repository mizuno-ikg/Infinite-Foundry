'use strict';
const assert=require('assert'),fs=require('fs');
const E=require('../engine.js'),L=require('../playfeel-logic.js');

const round9=fs.readFileSync('playfeel-round9.js','utf8');
const round10=fs.readFileSync('playfeel-round10.js','utf8');
assert(round9.includes("round10.src='playfeel-round10.js'"),'Round 9 must chain-load Round 10');
assert(round10.includes('eraBriefPending=true'),'Era briefing transition must persist a pending marker');
assert(round10.includes('eraBriefPending=false'),'BEGIN ERA must clear the pending marker');
assert(round10.includes('restoreBriefing()'),'Round 10 must restore a pending briefing after reload');

const meta=E.baseMeta(12345);meta.era=4;meta.highestEra=4;meta.automationMode='smart';meta.upgrades.automation=2;
let state=E.createState(meta);
const cap=L.ensureOverclockCapacitor(state);cap.charges=2;cap.progress=17;state.cycle.playfeel.eraBriefPending=true;
const restored=E.deserialize(E.serialize(state));
assert(restored,'serialized playfeel state should deserialize');
assert.strictEqual(restored.meta.automationMode,'smart','Automation delegation choice must survive reload');
assert.strictEqual(restored.cycle.playfeel.eraBriefPending,true,'Era briefing pending state must survive reload');
assert.strictEqual(restored.cycle.playfeel.overclockCapacitor.charges,2,'Overclock capacitor charges must survive reload');
assert.strictEqual(restored.cycle.playfeel.overclockCapacitor.progress,17,'Overclock recharge progress must survive reload');
console.log('playfeel round10 contract: pass');
