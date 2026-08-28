'use strict';
const assert=require('assert');
const E=require('../engine.js');
const install=require('../prestige-m11.js');
const P=install(E);

{
  const fresh=E.createState(E.baseMeta(123));
  assert.strictEqual(fresh.meta.foundryMemory,0);
  assert.strictEqual(fresh.cycle.credits,20);
}
{
  const m=E.baseMeta(123);m.foundryMemory=4;
  const s=E.createState(m);
  assert(s.cycle.credits>20,'Memory must improve next-run starting strength continuously');
}
{
  const control=E.createState(E.baseMeta(7));
  const focus=E.createState(E.baseMeta(7));
  P.setResearchFocus(focus,true);
  E.advance(control,45);E.advance(focus,45);
  assert(focus.cycle.credits<control.cycle.credits,'Research Focus must trade current credits for future progress');
  assert(focus.cycle.researchData>=0.99,'Research Focus should accumulate low-frequency research progress');
}
{
  const s=E.createState(E.baseMeta(9));
  assert.strictEqual(P.awardMemory(s,{aborted:true}),0,'Immediate abort must not farm Memory');
}
{
  const s=E.createState(E.baseMeta(10));
  E.advance(s,30);
  const earned=P.awardMemory(s,{aborted:true});
  assert(earned>=1,'A meaningful partial run must retain at least a little Memory');
  assert.strictEqual(P.awardMemory(s,{aborted:true}),0,'Memory award must be idempotent per run');
}
{
  const m=E.baseMeta(11);m.foundryMemory=60;
  const s=E.createState(m);
  assert(s.meta.upgrades.automation>=1,'Memory threshold should unlock automation breakthrough');
  assert(s.meta.upgrades.moduleBay>=1,'Memory threshold should unlock module bay breakthrough');
  assert(s.cycle.modules.length>=3,'Breakthrough module bay must be effective in the run');
}
{
  const legacy=E.createState(E.baseMeta(12));
  delete legacy.meta.foundryMemory;delete legacy.meta.memorySchemaVersion;
  legacy.meta.blueprints=10;legacy.meta.upgrades.efficiency=1;
  const restored=E.deserialize(JSON.stringify({version:5,savedAt:Date.now(),state:legacy}));
  assert(restored&&restored.meta.foundryMemory>0,'Legacy Blueprint assets must migrate into non-zero Memory without loss');
}
console.log('prestige-m11-contract: PASS');