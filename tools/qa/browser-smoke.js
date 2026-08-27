'use strict';
const http=require('http');
const fs=require('fs');
const path=require('path');
const {spawn}=require('child_process');
const assert=require('assert');
const ROOT=path.resolve(__dirname,'../..'),OUT=path.join(ROOT,'qa-browser');
fs.mkdirSync(OUT,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'};
const server=http.createServer((req,res)=>{let p=req.url.split('?')[0];if(p==='/'||p==='')p='/index.html';const f=path.join(ROOT,p);if(!f.startsWith(ROOT)||!fs.existsSync(f)){res.writeHead(404);return res.end('not found')}res.setHeader('content-type',mime[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitJson(url,tries=60){for(let i=0;i<tries;i++){try{const r=await fetch(url);if(r.ok)return r.json()}catch(_){}await sleep(100)}throw new Error('Chrome DevTools did not become ready')}
async function main(){
  await new Promise(r=>server.listen(4173,'127.0.0.1',r));
  const chrome=process.env.CHROME_BIN||'/usr/bin/google-chrome';
  assert(fs.existsSync(chrome),`Chrome not found at ${chrome}`);
  const proc=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars','--remote-debugging-port=9222','--user-data-dir=/tmp/if-chrome-profile','http://127.0.0.1:4173/index.html'],{stdio:['ignore','ignore','pipe']});
  let chromeErr='';proc.stderr.on('data',d=>chromeErr+=d.toString());
  try{
    const targets=await waitJson('http://127.0.0.1:9222/json');
    const page=targets.find(x=>x.type==='page');assert(page?.webSocketDebuggerUrl,'page target missing');
    const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true})});
    let id=0;const pending=new Map(),exceptions=[];
    ws.addEventListener('message',ev=>{const m=JSON.parse(String(ev.data));if(m.id&&pending.has(m.id)){const {resolve,reject}=pending.get(m.id);pending.delete(m.id);m.error?reject(new Error(JSON.stringify(m.error))):resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails?.text||'runtime exception')});
    const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}))});
    const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result?.value};
    await send('Runtime.enable');await send('Page.enable');
    await evaluate(`new Promise(r=>{if(document.readyState==='complete')r();else addEventListener('load',r,{once:true});setTimeout(r,1000)})`);await sleep(500);
    const report=[];
    for(const viewport of [{name:'desktop',width:1440,height:1000,mobile:false},{name:'mobile',width:390,height:844,mobile:true}]){
      await send('Emulation.setDeviceMetricsOverride',{width:viewport.width,height:viewport.height,deviceScaleFactor:1,mobile:viewport.mobile});
      for(const era of [1,4,7]){
        const info=await evaluate(`(()=>{state.meta.era=${era};state.meta.highestEra=7;state.cycle.speed=1;state.cycle.levels={source:6,process:6,transfer:6,assembly:6,power:6};state.cycle.time=Math.min(E.currentEra(state).duration*.42,E.currentEra(state).duration-35);render();return new Promise(r=>setTimeout(()=>r({era:state.meta.era,bodyEra:document.body.dataset.era,protocol:document.getElementById('protocolName')?.textContent||'',machine:document.querySelector('.machine.source b')?.textContent||'',overflow:document.documentElement.scrollWidth-window.innerWidth,world:!!document.querySelector('.era-world')}),180))})()`);
        assert.equal(Number(info.bodyEra),era,`body era mismatch for ${era}`);assert(info.world,'era world missing');assert(info.protocol,'domain protocol UI missing');assert(info.machine,'machine identity missing');assert(info.overflow<=1,`${viewport.name} Era ${era} horizontal overflow ${info.overflow}px`);
        const shot=await send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});fs.writeFileSync(path.join(OUT,`era-${era}-${viewport.name}.png`),Buffer.from(shot.data,'base64'));
        report.push({viewport:viewport.name,...info});
      }
    }
    assert.equal(exceptions.length,0,`browser runtime exceptions: ${exceptions.join('; ')}`);
    fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify({generatedAt:new Date().toISOString(),exceptions,report},null,2));
    console.log(JSON.stringify(report,null,2));
    ws.close();
  } finally {proc.kill('SIGTERM');server.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
