'use strict';
(()=>{
  const E=window.InfiniteFoundryEngine,L=window.InfiniteFoundryBalanceM10Logic,P=window.InfiniteFoundryPrestigeM11;
  if(!E||!L)return;
  const statusOverlay=document.getElementById('statusOverlay');
  let statusAutoPaused=false;

  const style=document.createElement('style');
  style.dataset.balanceM10='controls';
  style.textContent=`
    .salvage-run-row{display:flex;justify-content:flex-end;margin-top:4px;gap:6px;flex-wrap:wrap}
    .salvage-run-btn,.research-focus-btn{width:100%;border:1px solid #55483d;background:#151311;color:#bcae9d;padding:7px 9px;font-size:8px;font-weight:800;letter-spacing:.08em;cursor:pointer}
    .salvage-run-btn:hover,.research-focus-btn:hover{border-color:#8b6f51;color:#ecd4b8}.salvage-run-btn:disabled,.research-focus-btn:disabled{opacity:.35;cursor:not-allowed}
    .research-focus-btn.active{border-color:#b98b57;color:#ffe1ae;background:#21180f}
    .memory-result-m11{margin-top:10px;border:1px solid #4e4439;background:#12100e;padding:9px 10px;display:grid;gap:4px}
    .memory-result-m11 strong{font-size:9px;letter-spacing:.1em;color:#f1d0a1}.memory-result-m11 span{font-size:9px;color:#c6b9a9}.memory-result-m11 small{font-size:8px;color:#8f8478}
    .inventory-actions button{display:grid;gap:2px;align-content:center;min-width:118px}
    .inventory-actions button small{font-size:7px;letter-spacing:.04em;opacity:.72;font-weight:600;white-space:nowrap}
    .inventory-actions button.preview-up small{color:#d8c49e;opacity:1}
    .inventory-actions button.preview-down small{color:#bb8d83;opacity:1}
    .m13-first-clear{display:block;margin-top:5px;font-size:8px;font-weight:900;letter-spacing:.08em;color:#f1d0a1}
    .era-node.past span::after{content:' · ARCHIVED';font-size:.7em;opacity:.58;letter-spacing:.06em}
    @media(max-width:620px){.salvage-run-btn,.research-focus-btn{min-height:44px;font-size:9px}.inventory-actions button{min-width:0;width:100%;min-height:44px}}
  `;
  document.head.append(style);

  function statusOpener(target){return target?.closest?.('#statusBtn,#moduleFeed,#resultStatusBtn,.module-slot')}
  function pauseForStatus(){
    if(typeof paused==='undefined'||typeof togglePause!=='function'||!state?.cycle)return;
    if(paused||introOpen||state.cycle.ended)return;
    statusAutoPaused=true;
    togglePause(true);
  }
  document.addEventListener('click',e=>{if(statusOpener(e.target))pauseForStatus()},true);
  if(statusOverlay){
    new MutationObserver(()=>{
      if(!statusOverlay.hidden){
        if(!paused&&!introOpen&&!state.cycle.ended){statusAutoPaused=true;togglePause(true)}
        return;
      }
      if(!statusAutoPaused)return;
      statusAutoPaused=false;
      if(paused&&!introOpen&&!state.cycle.ended)togglePause(false);
    }).observe(statusOverlay,{attributes:true,attributeFilter:['hidden']});
    const note=statusOverlay.querySelector('.status-note');
    if(note)note.textContent='Foundry clock is halted while STATUS / LOADOUT is open. Closing resumes only if the run was previously active.';
  }

  function syncSpeedUI(){
    const speed=Number(state?.cycle?.speed)||1;
    document.querySelectorAll('.speed button[data-speed]').forEach(btn=>btn.classList.toggle('active',Number(btn.dataset.speed)===speed));
  }
  for(const id of ['restartBtn','advanceEraBtn'])document.getElementById(id)?.addEventListener('click',()=>requestAnimationFrame(syncSpeedUI));
  syncSpeedUI();

  function salvageCurrentRun(){
    if(!state?.cycle||state.cycle.ended||introOpen)return false;
    const earned=L.earlySalvageValue(state,E);
    const memory=P?P.memoryForecast(state):0;
    const message=`End this run now and salvage ${earned} Blueprint${earned===1?'':'s'}${P?` plus ${memory} Foundry Memory`:''} from progress earned so far?`;
    if(typeof confirm==='function'&&!confirm(message))return false;
    const avg=E.sustainedAverage(state,30);
    state.cycle.ended=true;
    state.cycle.result={win:false,aborted:true,average:avg,blueprintsEarned:earned,eraCompleted:false,patentsEarned:0,finalBottleneck:E.rawBottleneck(state)};
    state.meta.blueprints+=earned;
    state.meta.bestThroughput=Math.max(state.meta.bestThroughput,avg);
    state.meta.totalOutput+=state.cycle.output;
    const memoryEarned=P?P.awardMemory(state,{aborted:true}):0;
    paused=false;
    if(typeof save==='function')save();
    if(typeof log==='function')log(`EARLY SALVAGE // +${earned} BP${P?` // +${memoryEarned} MEMORY`:''} retained from current progress`);
    if(typeof render==='function')render();
    requestAnimationFrame(()=>document.getElementById('prestigePanel')?.scrollIntoView({block:'start',behavior:'auto'}));
    return true;
  }

  const top=document.querySelector('.top-controls');
  if(top&&!document.getElementById('salvageRunBtn')){
    const row=document.createElement('div');row.className='salvage-run-row';
    if(P){
      const focus=document.createElement('button');focus.id='researchFocusBtn';focus.type='button';focus.className='research-focus-btn';focus.textContent='RESEARCH FOCUS // OFF';
      focus.title='Divert 18% of current production value into Foundry Memory research. Best used when this run is becoming a salvage run.';
      focus.addEventListener('click',()=>{if(P.setResearchFocus(state,!state.cycle.researchFocus)){if(typeof log==='function')log(`RESEARCH FOCUS // ${state.cycle.researchFocus?'ON — 18% diverted':'OFF — full production restored'}`);if(typeof render==='function')render()}});row.append(focus);
    }
    const btn=document.createElement('button');btn.id='salvageRunBtn';btn.type='button';btn.className='salvage-run-btn';btn.textContent='SALVAGE RUN / REBUILD EARLY';
    btn.title='End this run early. Progress earned so far is salvaged before the next rebuild.';
    btn.addEventListener('click',salvageCurrentRun);row.append(btn);top.append(row);
  }

  function baseStartingCreditsAt(memory){
    if(!P||!state?.meta)return null;
    const m=JSON.parse(JSON.stringify(state.meta));m.foundryMemory=Math.max(0,Number(memory)||0);P.applyBreakthroughFloors(m);
    return 20+8*(Number(m.upgrades?.capital)||0)+P.continuousBonus(m);
  }
  function refreshMemoryResult(){
    const r=state?.cycle?.result,panel=document.getElementById('prestigePanel');
    if(!P||!r||!panel||!Number.isFinite(Number(r.memoryAfter)))return;
    const before=Number(r.memoryBefore)||0,after=Number(r.memoryAfter)||0,next=P.BREAKTHROUGHS.find(x=>after<x.threshold),startBefore=baseStartingCreditsAt(before),startAfter=baseStartingCreditsAt(after);
    let box=document.getElementById('memoryResultM11');if(!box){box=document.createElement('div');box.id='memoryResultM11';box.className='memory-result-m11';const anchor=document.getElementById('resultReason');(anchor?.parentNode||panel).insertBefore(box,anchor?.nextSibling||null)}
    const unlocked=(r.newBreakthroughs||[]).length?`NEW BREAKTHROUGH // ${r.newBreakthroughs.join(' · ')}`:(next?`NEXT BREAKTHROUGH // ${next.threshold-after} MEMORY TO ${next.name}`:'ALL BREAKTHROUGHS ONLINE');
    box.innerHTML=`<strong>RETAINED PROGRESS // +${Number(r.memoryEarned)||0} MEMORY</strong><span>FOUNDRY MEMORY ${Math.floor(before)} → ${Math.floor(after)}</span><span>BASE STARTING CREDITS ${startBefore.toFixed(1)} → ${startAfter.toFixed(1)}</span><small>${unlocked}</small>`;
  }

  function linePreview(uid,bay){
    try{
      const before=E.throughput(state),copy=JSON.parse(JSON.stringify(state));
      if(!E.equipModule(copy,uid,bay))return {before,after:before};
      return {before,after:E.throughput(copy)};
    }catch(_){return null}
  }
  function refreshLoadoutActions(){
    if(!state?.cycle||!statusOverlay||statusOverlay.hidden)return;
    document.querySelectorAll('#moduleInventory button[data-uid][data-bay]').forEach(btn=>{
      const uid=btn.dataset.uid,bay=Number(btn.dataset.bay),from=state.cycle.modules.findIndex(x=>x?.uid===uid),target=state.cycle.modules[bay]||null;
      if(from===bay){btn.innerHTML=`EQUIPPED · BAY ${bay+1}<small>ACTIVE LOADOUT</small>`;btn.classList.remove('preview-up','preview-down');return}
      const verb=target?(from>=0?'SWAP':'REPLACE'):'EQUIP',preview=linePreview(uid,bay);
      if(!preview){btn.textContent=`${verb} → BAY ${bay+1}`;return}
      const delta=preview.after-preview.before;
      btn.classList.toggle('preview-up',delta>1e-9);btn.classList.toggle('preview-down',delta<-1e-9);
      btn.innerHTML=`${verb} → BAY ${bay+1}<small>LINE ${preview.before.toFixed(1)} → ${preview.after.toFixed(1)} /s</small>`;
      btn.title=`Whole-line throughput preview: ${preview.before.toFixed(2)} → ${preview.after.toFixed(2)} /s`;
    });
  }
  function refreshEraFlow(){
    const r=state?.cycle?.result;if(!r)return;
    const adv=E.canAdvanceEra(state),advance=document.getElementById('advanceEraBtn'),restart=document.getElementById('restartBtn'),summary=document.getElementById('resultSummary'),reason=document.getElementById('resultReason');
    if(r.win&&adv){
      if(advance){advance.hidden=false;advance.textContent=`ADVANCE TO ERA ${Math.min(7,(Number(state.meta.era)||1)+1)}`}
      if(restart)restart.hidden=true;
      if(reason)reason.textContent='Directive secured. This Era is archived; continue forward with all retained knowledge.';
    }else if(restart)restart.hidden=false;
    if(r.win&&r.patentsEarned&&summary&&!summary.querySelector('.m13-first-clear')){
      const note=document.createElement('span');note.className='m13-first-clear';note.textContent=`FIRST CLEAR REWARD // +${r.patentsEarned} PATENT · ONE-TIME`;summary.append(note);
    }
  }

  function refresh(){
    const btn=document.getElementById('salvageRunBtn');
    if(btn)btn.disabled=!!(!state?.cycle||state.cycle.ended||introOpen);
    const focus=document.getElementById('researchFocusBtn');
    if(focus){
      focus.disabled=!!(!state?.cycle||state.cycle.ended||introOpen);
      const active=!!state?.cycle?.researchFocus;focus.classList.toggle('active',active);
      focus.textContent=`RESEARCH FOCUS // ${active?'ON':'OFF'}${P&&state?.cycle?` // NEXT +${P.memoryForecast(state)} MEMORY`:''}`;
    }
    if(state?.cycle?.result?.aborted){
      const title=document.getElementById('resultTitle'),summary=document.getElementById('resultSummary'),reason=document.getElementById('resultReason'),restart=document.getElementById('restartBtn');
      if(title){title.textContent='RUN SALVAGED';title.className='fail'}
      if(summary)summary.textContent=`Early rebuild secured +${state.cycle.result.blueprintsEarned} Blueprint${P?` and +${state.cycle.result.memoryEarned||0} Foundry Memory`:''} from progress already earned this run.`;
      if(reason)reason.textContent='Current foundry was dismantled by choice. Retained progress is already banked; rebuild immediately when ready.';
      if(restart)restart.textContent='BEGIN NEXT CYCLE';
    }
    refreshMemoryResult();refreshLoadoutActions();refreshEraFlow();
    const wallet=document.getElementById('metaWallet');
    if(wallet&&P&&state?.meta){
      const m=Math.floor(state.meta.foundryMemory||0),next=P.BREAKTHROUGHS.find(x=>m<x.threshold);
      const memory=document.getElementById('memoryWalletM11')||document.createElement('span');
      memory.id='memoryWalletM11';memory.textContent=`FOUNDRY MEMORY ${m}${next?` // NEXT BREAKTHROUGH ${next.threshold-m} TO ${next.name}`:' // ALL BREAKTHROUGHS ONLINE'}`;
      if(!memory.parentNode)wallet.prepend(memory);
    }
    setTimeout(refresh,100);
  }
  refresh();

  window.InfiniteFoundryBalanceM10={earlySalvageValue:s=>L.earlySalvageValue(s,E),salvageCurrentRun,syncSpeedUI,linePreview};
})();
