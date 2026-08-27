'use strict';
const fs=require('fs');
const path=require('path');
const {spawn,execFileSync}=require('child_process');
const assert=require('assert');
const ROOT=path.resolve(__dirname,'../..'),OUT=path.join(ROOT,'qa-browser');
fs.mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function findChrome(){if(process.env.CHROME_BIN&&fs.existsSync(process.env.CHROME_BIN))return process.env.CHROME_BIN;for(const name of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){try{const p=execFileSync('which',[name],{encoding:'utf8'}).trim();if(p&&fs.existsSync(p))return p}catch(_){}}for(const p of ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/snap/bin/chromium'])if(fs.existsSync(p))return p;throw new Error('No Chrome/Chromium binary found on runner')}
function chromeArgs(profile,width,height,url,budget=1800){return ['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--hide-scrollbars','--no-first-run','--no-default-browser-check',`--user-data-dir=${profile}`,`--virtual-time-budget=${budget}`,`--window-size=${width},${height}`,url]}
async function main(){
  const chrome=findChrome();console.log(`browser qa using ${chrome}`);
  const server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{cwd:ROOT,stdio:'ignore'});await sleep(500);
  const report=[];
  try{
    for(const viewport of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}]){
      for(const era of [1,4,7]){
        const url=`http://127.0.0.1:4173/index.html?qaEra=${era}`;
        const base=`/tmp/if-qa-${process.pid}-${viewport.name}-${era}`;
        const dom=execFileSync(chrome,[...chromeArgs(`${base}-dom`,viewport.width,viewport.height,url),'--dump-dom'],{encoding:'utf8',timeout:20000,stdio:['ignore','pipe','ignore']});
        assert(dom.includes(`data-era="${era}"`),`${viewport.name} Era ${era}: body era missing`);
        assert(dom.includes('data-qa-overflow="0"'),`${viewport.name} Era ${era}: horizontal overflow detected`);
        assert(dom.includes('class="era-world"'),`${viewport.name} Era ${era}: visual world missing`);
        assert(/id="protocolName">[^<]+</.test(dom),`${viewport.name} Era ${era}: domain protocol UI missing`);
        const expected=era===1?'SOURCE':era===4?'CRUST MINES':'PRIME MATTER';assert(dom.includes(`>${expected}</b>`),`${viewport.name} Era ${era}: machine identity missing`);
        const screenshot=path.join(OUT,`era-${era}-${viewport.name}.png`);
        execFileSync(chrome,[...chromeArgs(`${base}-shot`,viewport.width,viewport.height,url),`--screenshot=${screenshot}`],{timeout:20000,stdio:'ignore'});
        assert(fs.existsSync(screenshot)&&fs.statSync(screenshot).size>10000,`${viewport.name} Era ${era}: screenshot missing/empty`);
        report.push({kind:'render',viewport:viewport.name,era,overflow:0,protocol:true,machine:expected,screenshot:path.basename(screenshot)});
      }
      const flowUrl='http://127.0.0.1:4173/tools/qa/browser-flow.html';
      const flowBase=`/tmp/if-flow-${process.pid}-${viewport.name}`;
      const flowDom=execFileSync(chrome,[...chromeArgs(flowBase,viewport.width,viewport.height,flowUrl,6000),'--dump-dom'],{encoding:'utf8',timeout:30000,stdio:['ignore','pipe','ignore']});
      assert(flowDom.includes('data-qa-flow="pass"'),`${viewport.name}: interaction flow failed`);
      assert(flowDom.includes('data-qa-era="2"'),`${viewport.name}: ascend/reload did not preserve Era II`);
      assert(flowDom.includes('data-qa-speed="4"'),`${viewport.name}: ×4 speed did not survive reload`);
      assert(flowDom.includes('data-qa-reload="pass"'),`${viewport.name}: save/reload flow missing`);
      assert(flowDom.includes('data-qa-upgrade="pass"'),`${viewport.name}: machine tap/upgrade flow missing`);
      const flowScreenshot=path.join(OUT,`interaction-${viewport.name}.png`);
      execFileSync(chrome,[...chromeArgs(`${flowBase}-shot`,viewport.width,viewport.height,flowUrl,6000),`--screenshot=${flowScreenshot}`],{timeout:30000,stdio:'ignore'});
      assert(fs.existsSync(flowScreenshot)&&fs.statSync(flowScreenshot).size>10000,`${viewport.name}: interaction screenshot missing/empty`);
      report.push({kind:'interaction',viewport:viewport.name,prestige:true,patent:true,blueprint:true,ascendEra:2,speed:4,upgrade:true,reload:true,screenshot:path.basename(flowScreenshot)});

      const corruptUrl='http://127.0.0.1:4173/tools/qa/browser-corrupt-save.html';
      const corruptBase=`/tmp/if-corrupt-${process.pid}-${viewport.name}`;
      const corruptDom=execFileSync(chrome,[...chromeArgs(corruptBase,viewport.width,viewport.height,corruptUrl,5000),'--dump-dom'],{encoding:'utf8',timeout:30000,stdio:['ignore','pipe','ignore']});
      assert(corruptDom.includes('data-qa-corrupt="pass"'),`${viewport.name}: corrupt save recovery failed`);
      report.push({kind:'corrupt-save',viewport:viewport.name,recovered:true});
    }
    fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify({generatedAt:new Date().toISOString(),chrome,report},null,2));
    console.log(JSON.stringify(report,null,2));
  } finally {server.kill('SIGTERM')}
}
main().catch(e=>{console.error(e);process.exitCode=1});
