'use strict';
const assert=require('assert'),fs=require('fs');
const js=fs.readFileSync('playfeel-round16.js','utf8');
const loader=fs.readFileSync('playfeel-round12.js','utf8');
assert(loader.includes("round16.src='playfeel-round16.js'"),'Round 16 preview guard must be loaded');
assert(js.includes("if(!F.canUpgrade(state,id))"),'unaffordable direct-upgrade previews must short-circuit before hypothetical state creation');
assert(js.includes('available:false'),'short-circuit must preserve the upgradeOutcome unavailable contract');
assert(js.includes('baseUpgradeOutcome(state,F,id)'),'affordable previews must preserve the canonical playfeel calculation');
console.log('playfeel round16 contract: ok');
