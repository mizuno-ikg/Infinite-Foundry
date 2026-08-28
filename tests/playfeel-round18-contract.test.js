'use strict';
const fs=require('fs'),assert=require('assert');
const r17=fs.readFileSync('playfeel-round17.js','utf8');
const r18=fs.readFileSync('playfeel-round18.js','utf8');
assert(r17.includes("next.src='playfeel-round18.js'"),'Round 18 must be chained from Round 17');
assert(r18.includes('.toast-stack{top:118px}'),'desktop toast safe zone missing');
assert(r18.includes('@media(max-width:1100px){.toast-stack{top:152px}}'),'tablet toast safe zone missing');
assert(r18.includes('@media(max-width:620px){.toast-stack{top:184px;right:8px'),'mobile toast safe zone missing');
console.log('playfeel round18 contract: ok');
