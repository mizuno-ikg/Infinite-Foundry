const assert=require('assert');
const fs=require('fs');
const path=require('path');
const E=require('../engine.js');

function smartWorkshopCycle(state){
  while(!state.cycle.ended){
    if(state.cycle.time+1e-9>=state.cycle.overclockReady) E.pulse(state);
    let bought=true;
    while(bought){
      bought=false;
      const id=E.rawBottleneck(state);
      if(E.canUpgrade(state,id)){E.upgrade(state,id);bought=true;}
    }
    E.advance(state,1);
  }
  return state;
}

let state=E.createState(E.baseMeta(424242));
smartWorkshopCycle(state);
assert(state.cycle.result,'cycle reaches a resolved result');
assert(state.meta.blueprints>=2,'resolved cycle salvages blueprint progress');
const cycle1Result={...state.cycle.result};

const candidates=['capital','efficiency','automation','moduleBay'];
const purchased=candidates.find(id=>E.buyMetaUpgrade(state,id));
assert(purchased,'first resolved cycle provides at least one meaningful permanent purchase under smart play');
const retainedUpgradeLevel=state.meta.upgrades[purchased];
const remainingBlueprints=state.meta.blueprints;

state=E.restart(state);
assert.equal(state.meta.cycle,2,'rebuild begins the next numbered cycle');
assert.equal(state.meta.upgrades[purchased],retainedUpgradeLevel,'rebuild retains purchased design knowledge');
assert.equal(state.meta.blueprints,remainingBlueprints,'rebuild retains unspent blueprints');
assert.equal(state.cycle.time,0,'rebuild burns current-cycle time and machinery state');

E.advance(state,20);
const beforeSaveTime=state.cycle.time;
const raw=E.serialize(state);
const reloaded=E.deserialize(raw);
assert(reloaded,'mid-cycle save reload succeeds');
assert.equal(reloaded.meta.cycle,2,'reload preserves cycle identity');
assert.equal(reloaded.meta.upgrades[purchased],retainedUpgradeLevel,'reload preserves permanent investment');
assert(Math.abs(reloaded.cycle.time-beforeSaveTime)<1e-9,'reload does not grant offline/catch-up game time');
assert.deepStrictEqual(reloaded.cycle.levels,state.cycle.levels,'reload preserves current machinery levels');

const app=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const ids=[...app.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]);
for(const id of new Set(ids)) assert(html.includes(`id="${id}"`),`UI contract: index.html contains #${id}`);
assert(html.indexOf('engine.js')<html.indexOf('app.js'),'engine loads before browser adapter');
assert(/AUTOMATION MEMORY[\s\S]*auto-upgrades the current bottleneck/.test(html),'Automation Memory communicates its Workshop behavior');

console.log('foundation flow tests: ok',JSON.stringify({cycle1Win:cycle1Result.win,cycle1Average:cycle1Result.average,purchased}));
