'use strict';
const assert=require('assert');
const H=require('../tools/balance/human-proxy.js');
const E=require('../engine.js');

assert.deepStrictEqual(H.SPEEDS,[1,2,4,8]);
assert.strictEqual(H.normalizeSpeed(8),8);
assert.strictEqual(H.normalizeSpeed(3),1);

function seeded(){let x=0x12345678;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
for(const mode of ['attentive','relaxed']){
  const r1=seeded(),r8=seeded();
  for(let i=0;i<32;i++){
    const d1=H.decisionDelayGameSeconds(r1,mode,1);
    const d8=H.decisionDelayGameSeconds(r8,mode,8);
    assert.ok(Math.abs(d8-d1*8)<1e-9,`${mode}: x8 must preserve the same real-time decision delay`);
  }
}

for(const mode of ['attentive','relaxed']){
  const one=H.playCycle(E.createState(E.baseMeta(0x77aa11)),{mode,seed:0xabc123,speed:1});
  const eight=H.playCycle(E.createState(E.baseMeta(0x77aa11)),{mode,seed:0xabc123,speed:8});
  assert.ok(one.decisionsPerRealMinute>0&&eight.decisionsPerRealMinute>0);
  const ratio=eight.decisionsPerRealMinute/one.decisionsPerRealMinute;
  assert.ok(ratio>=0.45&&ratio<=1.8,`${mode}: x8 operation density should remain in the same real-time order, got ${ratio.toFixed(2)}x`);
  assert.ok(eight.decisions<one.decisions,`${mode}: x8 low-attention proxy must not simulate eight times as many manual decisions`);
}

console.log('M14 operation-density contract tests passed');
