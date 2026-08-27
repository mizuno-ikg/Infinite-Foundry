'use strict';
const assert=require('assert');
const M=require('../era-mechanics.js');
function state(era,levels={source:0,process:0,transfer:0,assembly:0,power:0}){return {meta:{era},cycle:{credits:1000,levels:{...levels},protocol:{thermalCharge:0,resonanceLevel:0},overclockUntil:4}}}
let s=state(2);let before=s.cycle.credits;let r=M.afterUpgrade(s,'source',100,true);assert(Math.abs(s.cycle.credits-before-8)<1e-9&&r.message.includes('AUTONOMOUS'),'Era II must reward diagnosed bottleneck investment');
s=state(3);before=s.cycle.credits;M.afterUpgrade(s,'transfer',100,false);assert(Math.abs(s.cycle.credits-before-18)<1e-9,'Era III must reward logistics investment');
s=state(4,{source:3,process:2,transfer:2,assembly:2,power:2});before=s.cycle.credits;M.afterUpgrade(s,'source',100,false);assert(Math.abs(s.cycle.credits-before-12)<1e-9,'Era IV must reward coupled source/transfer levels');
s=state(5);M.afterUpgrade(s,'power',100,false);assert.equal(s.cycle.protocol.thermalCharge,1,'Era V must bank thermal charge');r=M.afterPulse(s);assert(r.extended&&s.cycle.overclockUntil===6&&s.cycle.protocol.thermalCharge===0,'Era V thermal charge must extend one pulse');
s=state(6,{source:3,process:2,transfer:2,assembly:2,power:1});before=s.cycle.credits;M.afterUpgrade(s,'source',100,false);assert(Math.abs(s.cycle.credits-before-15)<1e-9,'Era VI must reward balanced law levels');
s=state(7,{source:1,process:1,transfer:1,assembly:1,power:1});before=s.cycle.credits;M.afterUpgrade(s,'power',100,false);assert(s.cycle.credits>before&&s.cycle.protocol.resonanceLevel===1,'Era VII must reward a new all-stage resonance floor');
for(let era=1;era<=7;era++){s=state(era);let d=M.describe(s);assert(d.name&&d.copy&&d.status,`Era ${era} protocol must be visible`);assert(M.storyFor(s,0,true).length>12,`Era ${era} needs a story beat`)}
console.log('era mechanics tests passed');
