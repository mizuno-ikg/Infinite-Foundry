'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),visual=fs.readFileSync(path.join(root,'era-visuals.js'),'utf8'),js=fs.readFileSync(path.join(root,'playfeel-round3.js'),'utf8'),css=fs.readFileSync(path.join(root,'playfeel-round3.css'),'utf8'),logic=fs.readFileSync(path.join(root,'playfeel-logic.js'),'utf8');
assert(visual.includes("playfeel-round3.css"));assert(visual.includes("playfeel-round3.js"));
assert(logic.includes('OVERCLOCK_CAPACITOR'));assert(logic.includes('maxCharges:3'));assert(logic.includes('rechargeSeconds:40'));assert(logic.includes('durationSeconds:8'));
assert(js.includes('OVERCLOCK CAPACITOR'));assert(js.includes('overclock-charges'));assert(js.includes('factory-drive'));assert(js.includes('machine-growth'));assert(js.includes('checkpoint-react'));
assert(js.includes('UI_STATE_REFRESH_MS=100'),'playfeel state UI must stay throttled');assert(js.includes('setTimeout(refresh,UI_STATE_REFRESH_MS)'),'playfeel state must not recompute every animation frame');assert(!js.includes('requestAnimationFrame(refresh)'),'playfeel refresh regressed to frame-rate polling');
assert(css.includes('.overclock-charges'));assert(css.includes('.factory-drive'));assert(css.includes('[data-level-tier="3"]'));assert(css.includes('.checkpoint-react'));
console.log('playfeel round3 contract: ok');