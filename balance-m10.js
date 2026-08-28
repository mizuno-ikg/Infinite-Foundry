'use strict';
(()=>{
  const E=window.InfiniteFoundryEngine,L=window.InfiniteFoundryBalanceM10Logic;
  if(!E||!L)return;
  const statusOverlay=document.getElementById('statusOverlay');
  let statusAutoPaused=false;

  const style=document.createElement('style');
  style.dataset.balanceM10='controls';
  style.textContent=`
    .salvage-run-row{display:flex;justify-content:flex-end;margin-top:4px}
    .salvage-run-btn{width:100%;border:1px solid #55483d;background:#151311;color:#bcae9d;padding:7px 9px;font-size:8px;font-weight:800;letter-spacing:.08em;cursor:pointer}
    .salvage-run-btn:hover{border-color:#8b6f51;color:#ecd4b8}.salvage-run-btn:disabled{opacity:.35;cursor:not-allowed}
    @media(max-width:620px){.salvage-run-btn{min-height:44px;font-size:9px}}
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
    const message=`End this run now and salvage ${earned} Blueprint${earned===1?'':'s'} from progress earned so far?`;
    if(typeof confirm==='function'&&!confirm(message))return false;
    const avg=E.sustainedAverage(state,30);
    state.cycle.ended=true;
    state.cycle.result={win:false,aborted:true,average:avg,blueprintsEarned:earned,eraCompleted:false,patentsEarned:0,finalBottleneck:E.rawBottleneck(state)};
    state.meta.blueprints+=earned;
    state.meta.bestThroughput=Math.max(state.meta.bestThroughput,avg);
    state.meta.totalOutput+=state.cycle.output;
    paused=false;
    if(typeof save==='function')save();
    if(typeof log==='function')log(`EARLY SALVAGE // +${earned} BP retained from current progress`);
    if(typeof render==='function')render();
    requestAnimationFrame(()=>document.getElementById('prestigePanel')?.scrollIntoView({block:'start',behavior:'auto'}));
    return true;
  }

  const top=document.querySelector('.top-controls');
  if(top&&!document.getElementById('salvageRunBtn')){
    const row=document.createElement('div');row.className='salvage-run-row';
    const btn=document.createElement('button');btn.id='salvageRunBtn';btn.type='button';btn.className='salvage-run-btn';btn.textContent='SALVAGE RUN / REBUILD EARLY';
    btn.title='End this run early. Progress earned so far is salvaged before the next rebuild.';
    btn.addEventListener('click',salvageCurrentRun);row.append(btn);top.append(row);
  }

  function refresh(){
    const btn=document.getElementById('salvageRunBtn');
    if(btn)btn.disabled=!!(!state?.cycle||state.cycle.ended||introOpen);
    if(state?.cycle?.result?.aborted){
      const title=document.getElementById('resultTitle'),summary=document.getElementById('resultSummary'),reason=document.getElementById('resultReason'),restart=document.getElementById('restartBtn');
      if(title){title.textContent='RUN SALVAGED';title.className='fail'}
      if(summary)summary.textContent=`Early rebuild secured +${state.cycle.result.blueprintsEarned} Blueprint from progress already earned this run.`;
      if(reason)reason.textContent='Current foundry was dismantled by choice. Spend retained knowledge now, then rebuild immediately.';
      if(restart)restart.textContent='BEGIN NEXT CYCLE';
    }
    setTimeout(refresh,100);
  }
  refresh();

  window.InfiniteFoundryBalanceM10={earlySalvageValue:s=>L.earlySalvageValue(s,E),salvageCurrentRun,syncSpeedUI};
})();
