'use strict';
const assert=require('assert');
const E=require('../engine.js');
const installPrestige=require('../prestige-m11.js');
const P=installPrestige(E);

function startingCredits(memory,seed=1501){
  const meta=E.baseMeta(seed);
  meta.foundryMemory=memory;
  return E.createState(meta).cycle.credits;
}

// M15 release-candidate contract: a meaningful failed/salvaged run must make the
// next cycle visibly stronger, while an immediate abort must not create progress.
{
  const s=E.createState(E.baseMeta(1501));
  const baseline=s.cycle.credits;
  E.advance(s,30);
  const before=s.meta.foundryMemory;
  const earned=P.awardMemory(s,{aborted:true});
  assert(earned>=1,'meaningful partial progress must retain Foundry Memory');
  assert(s.meta.foundryMemory>before,'Foundry Memory must increase after meaningful salvage');
  const next=E.restart(s,false);
  assert.strictEqual(next.cycle.speed,1,'rebuild must always reset simulation speed to x1');
  assert.strictEqual(next.meta.foundryMemory,s.meta.foundryMemory,'rebuild must retain Foundry Memory');
  assert(next.cycle.credits>baseline,'meaningful failure/salvage must make next-run starting strength visibly higher');
}

{
  const s=E.createState(E.baseMeta(1502));
  const before=s.meta.foundryMemory;
  assert.strictEqual(P.awardMemory(s,{aborted:true}),0,'immediate abort must not award Memory');
  const next=E.restart(s,false);
  assert.strictEqual(next.meta.foundryMemory,before,'immediate abort must not improve retained progression');
}

// Retained progression must be monotonic and survive save/reload.
{
  const low=startingCredits(2,1503);
  const high=startingCredits(12,1503);
  assert(high>low,'more Foundry Memory must never reduce starting credits');
  const meta=E.baseMeta(1504);meta.foundryMemory=31;
  const s=E.createState(meta);
  s.cycle.speed=4;
  const restored=E.deserialize(E.serialize(s));
  assert(restored,'valid save must deserialize');
  assert.strictEqual(restored.meta.foundryMemory,31,'save/reload must preserve Foundry Memory');
  assert(restored.meta.upgrades.automation>=1,'Memory breakthrough floor must survive save/reload');
  assert.strictEqual(restored.cycle.speed,4,'valid shipping speed must survive ordinary save/reload');
}

// Experimental/invalid speeds and corrupt saves must fail safely.
{
  const meta=E.baseMeta(1505);meta.foundryMemory=30;
  const s=E.createState(meta);
  s.cycle.speed=8;
  const restored=E.deserialize(E.serialize(s));
  assert(restored,'legacy experimental x8 save should still load safely');
  assert.strictEqual(restored.cycle.speed,1,'engine normalization must reject non-shipping x8 speed');
  assert.strictEqual(E.deserialize('{not-json'),null,'corrupt JSON save must fail closed');
  assert.strictEqual(E.deserialize(JSON.stringify({version:999,state:s})),null,'future incompatible save must fail closed');
}

// Current late-era curve is a release contract, not a long-wait difficulty substitute.
{
  assert.deepStrictEqual([1,2,3,4,5,6,7].map(id=>E.ERA_DEFS[id].duration),[150,165,180,195,210,225,240]);
  assert.deepStrictEqual([5,6,7].map(id=>E.ERA_DEFS[id].targets.at(-1)),[1400,3600,9700]);
}

// Research Focus remains an optional salvage conversion: it must cost current-run
// credits, create research only from production, and stay bounded as a Memory source.
{
  const control=E.createState(E.baseMeta(1506));
  const focus=E.createState(E.baseMeta(1506));
  P.setResearchFocus(focus,true);
  E.advance(control,45);E.advance(focus,45);
  assert(focus.cycle.credits<control.cycle.credits,'Research Focus must trade current strength for retained research');
  assert(focus.cycle.researchData>0,'Research Focus must accumulate only after production occurs');
  const normal=P.memoryEarned(control);
  focus.cycle.researchData=100;
  assert(P.memoryEarned(focus)-normal<=4,'Research Focus Memory contribution must remain capped');
}

console.log('m15-integration-contract: PASS');
