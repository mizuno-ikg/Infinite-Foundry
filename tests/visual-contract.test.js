'use strict';
const fs=require('fs');
const assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('era-visuals.css','utf8');
const js=fs.readFileSync('era-visuals.js','utf8');
assert(html.includes('href="era-visuals.css"'),'era visual stylesheet must be loaded');
assert(html.includes('src="era-visuals.js"'),'era visual runtime must be loaded');
for(let era=1;era<=7;era++){
  assert(css.includes(`data-era=\"${era}\"`)||css.includes(`data-era="${era}"`),`CSS identity missing for Era ${era}`);
  assert(new RegExp(`\\n\\s*${era}:\\{`).test(js),`machine identity missing for Era ${era}`);
}
for(const token of ['era-city','era-planet','era-elevator','era-star','era-orbit','era-rift','era-universe']){
  assert(js.includes(token),`${token} visual node missing`);
  assert(css.includes(`.${token}`),`${token} style missing`);
}
for(const growth of ['1','2','3'])assert(css.includes(`data-growth=\"${growth}\"`)||css.includes(`data-growth="${growth}"`),`growth tier ${growth} missing`);
assert(css.includes('prefers-reduced-motion'),'reduced-motion fallback required');
console.log('visual contract tests passed');
