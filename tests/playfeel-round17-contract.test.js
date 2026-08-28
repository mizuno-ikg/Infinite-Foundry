'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('playfeel-round17.js','utf8');
const loader=fs.readFileSync('playfeel-round16.js','utf8');
assert(loader.includes("round17.src='playfeel-round17.js'"),'Round 17 cache must be loaded after Round 16');
assert(source.includes('structuralSignature'),'preview cache must invalidate from structural gameplay state');
assert(!source.includes('cycle.credits'),'cache signature must not churn with continuously increasing Credits');
let upgradeCalls=0,moduleCalls=0;
const E={STAGE_DEFS:{source:{},process:{},transfer:{},assembly:{},power:{}},canUpgrade:()=>true};
const L={
  upgradeOutcome:(s,e,id)=>{upgradeCalls++;return {id,cost:10,before:2,after:3,gain:1,available:true}},
  modulePlacementPreview:(s,e,uid,bay)=>{moduleCalls++;return {before:2,after:2.5,gain:.5,changed:true,bay}}
};
const window={InfiniteFoundryPlayfeelLogic:L,InfiniteFoundryEngine:E};
vm.runInNewContext(source,{window,Number,Map});
const state={meta:{era:1,upgrades:{efficiency:0,moduleBay:0},patentUpgrades:{powerRouting:0}},cycle:{time:1,overclockUntil:0,ended:false,credits:20,levels:{source:1,process:1,transfer:1,assembly:1,power:1},modules:[{uid:'M1',target:'source',mult:1.1}]}};
L.upgradeOutcome(state,E,'source');state.cycle.credits=999;L.upgradeOutcome(state,E,'source');assert.equal(upgradeCalls,1,'Credits-only changes must reuse upgrade preview');
state.cycle.levels.source++;L.upgradeOutcome(state,E,'source');assert.equal(upgradeCalls,2,'level changes must invalidate upgrade preview');
state.cycle.overclockUntil=10;L.upgradeOutcome(state,E,'source');assert.equal(upgradeCalls,3,'Overclock active transition must invalidate upgrade preview');
L.modulePlacementPreview(state,E,'M1',0);state.cycle.credits=1500;L.modulePlacementPreview(state,E,'M1',0);assert.equal(moduleCalls,1,'Credits-only changes must reuse module preview');
state.cycle.modules[0].mult=1.2;L.modulePlacementPreview(state,E,'M1',0);assert.equal(moduleCalls,2,'module loadout changes must invalidate module preview');
console.log('playfeel round17 contract: ok');
