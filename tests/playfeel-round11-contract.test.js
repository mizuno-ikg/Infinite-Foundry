'use strict';
const assert=require('assert'),fs=require('fs');
const E=require('../engine.js');

const source=fs.readFileSync('playfeel-v1.2.js','utf8');
assert(source.includes('automationNextAt'),'Automation cadence must live in serialized cycle.playfeel state');
assert(source.includes('ensureAutomationSchedule'),'Automation cadence must be normalized from persisted state');
assert(!source.includes('let nextAutomationAt='),'Automation cadence must not reset to an in-memory timer on reload');
assert(source.includes('schedule.pf.automationNextAt=state.cycle.time+'),'Each delegated decision must advance the persisted cadence');
assert(source.includes('if(!decision){save();return}'),'A no-purchase automation check must still persist its next decision time');

const meta=E.baseMeta(24680);meta.upgrades.automation=2;meta.automationMode='smart';
let state=E.createState(meta);
state.cycle.time=133;
state.cycle.playfeel={automationNextAt:141};
const restored=E.deserialize(E.serialize(state));
assert(restored,'serialized automation schedule should deserialize');
assert.strictEqual(restored.cycle.playfeel.automationNextAt,141,'Automation next-decision time must survive reload');
assert.strictEqual(restored.meta.automationMode,'smart','Automation mode must survive reload alongside cadence');
console.log('playfeel round11 contract: pass');
