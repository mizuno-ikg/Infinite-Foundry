'use strict';
const assert=require('assert'),E=require('../engine.js'),L=require('../playfeel-logic.js');
let state=E.createState(E.baseMeta(20260827));state.meta.upgrades.automation=2;state.cycle.credits=1000;
let d=L.chooseAutomationUpgrade(state,E,'assist');assert(d);assert.equal(d.id,E.rawBottleneck(state));assert.equal(d.reserve,.4);
d=L.chooseAutomationUpgrade(state,E,'smart');assert(d);assert.equal(d.reserve,.3);
let mod=E.createState(E.baseMeta(17));mod.cycle.levels={source:10,process:10,transfer:10,assembly:10,power:0};const old={id:'thermal',uid:'old-power',name:'Old power',rarity:'TEST',target:'power',mult:1.25,effect:'POWER +25%'},neu={id:'servo',uid:'new-source',name:'New source',rarity:'TEST',target:'source',mult:1.4,effect:'SOURCE +40%'};mod.cycle.modules=[neu,null];mod.cycle.moduleInventory=[old,neu];mod.cycle.events=[{seq:9,type:'moduleRecovered',action:'replaced',bay:0,moduleUid:neu.uid,replaced:old.uid,name:neu.name,effect:neu.effect}];mod.cycle.nextEventSeq=10;const bad=E.throughput(mod),fixed=L.repairAutoModuleSwaps(mod,E,0);assert.equal(fixed.length,1);assert.equal(mod.cycle.modules[0].uid,old.uid);assert(E.throughput(mod)>bad);assert.equal(mod.cycle.events[0].action,'stored');
console.log('playfeel logic tests: ok');
