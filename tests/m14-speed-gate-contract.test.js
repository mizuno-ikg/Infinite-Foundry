'use strict';
const assert=require('assert');
const G=require('../tools/balance/m14-speed-gate.js');

assert.strictEqual(G.median([1,9,3,5]),3);
assert.strictEqual(G.ratio(8,4),2);
assert.deepStrictEqual(G.reachedAttempts([{attempts:[0,0,2]},{attempts:[0,0,0]},{attempts:[0,0,5]}],2),[2,5]);
assert.strictEqual(G.reachedRate([{attempts:[0,0,2]},{attempts:[0,0,0]},{attempts:[0,0,5]}],2),2/3);

const base={
  decisionsPerRealMinuteP50:10,
  buysPerRealMinuteP50:12,
  cyclesP50:20,
  finishRate:.9,
  lateReachedRate:[1,.9,.8]
};
const healthy={
  decisionsPerRealMinuteP50:11,
  buysPerRealMinuteP50:13,
  cyclesP50:23,
  finishRate:.85,
  x8UseRate:1,
  x8CyclesP50:8,
  lateReachedRate:[1,.85,.75]
};
const badDensity={...healthy,decisionsPerRealMinuteP50:25};
const badOutcome={...healthy,cyclesP50:30,finishRate:.5};
const badReach={...healthy,lateReachedRate:[.7,.5,.3]};
const locked={...healthy,x8UseRate:0,x8CyclesP50:0};

assert.strictEqual(G.evaluatePair(base,healthy).pass,true,'healthy unlocked x8 should pass');
assert.strictEqual(G.evaluatePair(base,badDensity).checks.decisionDensity,false,'x8 must not require runaway real-time decision density');
assert.strictEqual(G.evaluatePair(base,badOutcome).pass,false,'large cycle/finish penalties should reject x8');
assert.strictEqual(G.evaluatePair(base,badReach).checks.lateReach,false,'x8 must not look healthy by simply failing to reach late eras');
assert.strictEqual(G.evaluatePair(base,locked).checks.x8ActuallyUsed,false,'gate must reject a comparison where x8 never unlocked');

assert.strictEqual(G.lateEraFit({lateAttemptsP50:[2,4,6],lateReachedRate:[1,.9,.8]}).pass,true);
assert.strictEqual(G.lateEraFit({lateAttemptsP50:[7,9,14],lateReachedRate:[1,.9,.8]}).pass,false,'10+ style late-era repetition must not be accepted');
assert.strictEqual(G.lateEraFit({lateAttemptsP50:[2,4,0],lateReachedRate:[1,.9,0]}).pass,false,'unreached late eras must not be treated as easy zero-attempt eras');

console.log('m14-speed-gate-contract: PASS');
