'use strict';
const fs=require('fs');
const path=require('path');
const assert=require('assert');

const root=path.join(__dirname,'..');
const ux=fs.readFileSync(path.join(root,'balance-m10.js'),'utf8');

assert.match(ux,/EQUIPPED · BAY/,'equipped module action must name its bay');
assert.match(ux,/SWAP/,'moving an equipped module onto an occupied bay must be described as SWAP');
assert.match(ux,/REPLACE/,'placing a stored module onto an occupied bay must be described as REPLACE');
assert.match(ux,/EQUIP/,'placing a module into an empty bay must be described as EQUIP');
assert.match(ux,/LINE \$\{preview\.before\.toFixed\(1\)\} → \$\{preview\.after\.toFixed\(1\)\} \/s/,'loadout actions must expose whole-line throughput before/after');
assert.match(ux,/advance\.textContent=`ADVANCE TO ERA/,'successful Era flow must present one-way ADVANCE');
assert.match(ux,/restart\.hidden=true/,'same-Era rebuild must be hidden when forward Era advance is available');
assert.match(ux,/FIRST CLEAR REWARD \/\/ \+\$\{r\.patentsEarned\} PATENT · ONE-TIME/,'first-clear Patent must be explicitly one-time');
assert.match(ux,/ARCHIVED/,'past Eras must be labeled archived rather than implying replay is required');
assert.match(ux,/Foundry clock is halted while STATUS \/ LOADOUT is open/,'STATUS/LOADOUT must remain a clock-halted planning space');

console.log('M13 UX contract PASS');
