'use strict';
const assert=require('assert');
const G=require('../tools/balance/m14-speed-gate.js');

assert.strictEqual(G.median([1,9,3,5]),3);
assert.strictEqual(G.ratio(8,4),2);

const base={
  decisionsPerRealMinuteP50:10,
  buysPerRealMinuteP50:12,
  cyclesP50:20,
  finishRate:.9
};
const healthy={
  decisionsPerRealMinuteP50:11,
  buysPerRealMinuteP50:13,
  cyclesP50:23,
  finishRate:.85,
  x8UseRate:1,
  x8CyclesP50:8
};
const badDensity={...healthy,decisionsPerRealMinuteP50:25};
const badOutcome={...healthy,cyclesP50:30,finishRate:.5};
const locked={...healthy,x8UseRate:0,x8CyclesP50:0};

assert.strictEqual(G.evaluatePair(base,healthy).pass,true,'healthy unlocked x8 should pass');
assert.strictEqual(G.evaluatePair(base,badDensity).checks.decisionDensity,false,'x8 must not require runaway real-time decision density');
assert.strictEqual(G.evaluatePair(base,badOutcome).pass,false,'large cycle/finish penalties should reject x8');
assert.strictEqual(G.evaluatePair(base,locked).checks.x8ActuallyUsed,false,'gate must reject a comparison where x8 never unlocked');

assert.strictEqual(G.lateEraFit({lateAttemptsP50:[2,4,6]}).pass,true);
assert.strictEqual(G.lateEraFit({lateAttemptsP50:[7,9,14]}).pass,false,'10+ style late-era repetition must not be accepted');

console.log('m14-speed-gate-contract: PASS');
