'use strict';
(()=>{
  const E=window.InfiniteFoundryEngine,L=window.InfiniteFoundryPlayfeelLogic;
  if(!E||!L)return;
  const clone=x=>JSON.parse(JSON.stringify(x));
  const protocolFallback={
    1:['MANUAL DISCIPLINE','Identify and relieve the live bottleneck.'],
    2:['AUTONOMOUS RECLAIM','Correct bottleneck investment returns part of its cost.'],
    3:['LOGISTICS DIVIDEND','TRANSFER investment is subsidized by district reuse.'],
    4:['ORBITAL COUPLING','SOURCE and TRANSFER perform best when developed together.'],
    5:['THERMAL BANK','PROCESS / POWER investment stores longer Overclock bursts.'],
    6:['LAW SYMMETRY','Balanced stage levels recover part of their investment.'],
    7:['GENESIS RESONANCE','Raising every production layer releases creation grants.']
  };

  function buildUI(){
    document.querySelectorAll('.machine[data-id]').forEach(machine=>{
      if(machine.parentElement?.classList.contains('machine-wrap'))return;
      const wrap=document.createElement('div');wrap.className='machine-wrap';
      if(machine.classList.contains('power')){machine.classList.remove('power');wrap.classList.add('power','power-wrap')}
      machine.parentNode.insertBefore(wrap,machine);wrap.appendChild(machine);
      const btn=document.createElement('button');btn.type='button';btn.className='machine-upgrade';btn.dataset.upgradeId=machine.dataset.id;btn.innerHTML='<span class="upgrade-label">UPGRADE</span><span class="upgrade-cost">—</span>';wrap.appendChild(btn);
    });
    const milestones=document.querySelector('.milestones');
    if(milestones){milestones.querySelector('.eyebrow').textContent='DIRECTIVE CHECKPOINTS';if(!milestones.querySelector('.checkpoint-help')){const p=document.createElement('p');p.className='checkpoint-help';p.textContent='Checkpoint CLEAR improves salvage. A MISS does not end the run; only the FINAL DIRECTIVE decides success.';milestones.querySelector('.eyebrow').after(p)}}
    const analysis=document.querySelector('.upgrade');if(analysis)analysis.querySelector('.eyebrow').textContent='BOTTLENECK ANALYSIS';
    const modules=document.querySelector('.side .modules');
    if(modules&&!document.getElementById('automationPanel')){const section=document.createElement('section');section.id='automationPanel';section.className='automation-panel';section.innerHTML='<span class="eyebrow">DELEGATED CONTROL</span><h3>AUTOMATION MEMORY</h3><p>Automation never spends Credits unless you enable it. Higher levels unlock smarter delegation.</p><div class="automation-modes"><button type="button" data-auto-mode="off">OFF</button><button type="button" data-auto-mode="assist">ASSIST</button><button type="button" data-auto-mode="smart">SMART</button></div><span id="automationStatus" class="automation-status"></span>';modules.before(section)}
    const statusModal=document.querySelector('.status-modal'),loadout=document.querySelector('.loadout-layout');
    if(statusModal&&loadout&&!document.getElementById('statusLive')){const live=document.createElement('div');live.id='statusLive';live.className='status-live';live.innerHTML='<div><span>TIME</span><strong id="statusLiveTime">--:--</strong></div><div><span>THROUGHPUT / GOAL</span><strong id="statusLiveTp">—</strong></div><div><span>BOTTLENECK</span><strong id="statusLiveBottleneck">—</strong></div><div><span>AUTOMATION</span><strong id="statusLiveAutomation">OFF</strong></div>';loadout.before(live)}
    const retained=document.querySelector('.retained-strip');
    if(retained&&!document.getElementById('knowledgeImpact')){const impact=document.createElement('div');impact.id='knowledgeImpact';impact.className='knowledge-impact';retained.after(impact)}
    if(!document.getElementById('rebuildBanner')){const banner=document.createElement('div');banner.id='rebuildBanner';banner.className='rebuild-banner';banner.hidden=true;banner.innerHTML='<span>REBUILD COMPLETE</span><strong id="rebuildBannerTitle">RETAINED KNOWLEDGE ONLINE</strong><small id="rebuildBannerCopy"></small>';document.querySelector('.factory-card')?.prepend(banner)}
    if(!document.getElementById('eraBriefOverlay')){const overlay=document.createElement('div');overlay.id='eraBriefOverlay';overlay.className='overlay era-brief-overlay';overlay.hidden=true;overlay.innerHTML='<section class="modal era-brief-modal" role="dialog" aria-modal="true" aria-labelledby="eraBriefTitle"><span class="eyebrow">NEW PRODUCTION DOMAIN // CLOCK HALTED</span><strong id="eraBriefEra" class="intro-era"></strong><h2 id="eraBriefTitle"></h2><p id="eraBriefFocus" class="era-brief-focus"></p><div class="era-brief-grid"><div><span>FINAL DIRECTIVE</span><strong id="eraBriefTarget"></strong><small id="eraBriefDeadline"></small></div><div><span>NEW DOMAIN PROTOCOL</span><strong id="eraBriefProtocol"></strong><small id="eraBriefProtocolCopy"></small></div></div><div class="era-brief-retained"><span>RETAINED KNOWLEDGE</span><strong id="eraBriefRetained"></strong></div><div class="modal-actions"><button id="eraBriefBegin" class="primary-action" type="button">BEGIN ERA</button></div></section>';document.body.appendChild(overlay)}
    const qa=document.querySelector('.qa-grid');
    if(qa&&!qa.querySelector('[data-playfeel-help="automation"]')){const a=document.createElement('article');a.dataset.playfeelHelp='automation';a.innerHTML='<h3>Automation Memoryとは？</h3><p>転生で解禁する「単純作業を委譲する権限」です。購入しただけでは自動消費せず初期状態は<b>OFF</b>。ASSIST / SMARTを自分で有効化した時だけCreditsを使います。</p>';qa.append(a);const c=document.createElement('article');c.dataset.playfeelHelp='checkpoint';c.innerHTML='<h3>CHECKPOINTは必須？</h3><p>いいえ。途中CHECKPOINTは進捗目安とSalvage報酬に影響します。MISSしても周回は続き、勝敗は最後の<b>FINAL DIRECTIVE</b>だけで決まります。</p>';qa.append(c)}
    const autoMeta=document.querySelector('[data-meta-upgrade="automation"] small');if(autoMeta)autoMeta.textContent='Unlock player-controlled routine automation. Default OFF.';
    const footer=document.querySelector('footer>span');if(footer)footer.textContent='VERSION 1.2 DEV // playfeel iteration';
  }
  buildUI();

  const centralUpgrade=document.getElementById('upgradeBtn');
  const autoButtons=[...document.querySelectorAll('[data-auto-mode]')];
  let transitionSnapshot=null,rebuildBannerTimer=0,knowledgeKey='';

  function ensureAutomationMode(){
    const level=Number(state.meta.upgrades.automation)||0;
    if(!['off','assist','smart'].includes(state.meta.automationMode))state.meta.automationMode='off';
    if(level<1&&state.meta.automationMode!=='off')state.meta.automationMode='off';
    if(level<2&&state.meta.automationMode==='smart')state.meta.automationMode='assist';
  }
  ensureAutomationMode();

  function ensureAutomationSchedule(s=state){
    if(!s?.cycle)return null;
    if(!s.cycle.playfeel)s.cycle.playfeel={};
    const pf=s.cycle.playfeel;
    const floor=Math.max(75,E.currentEra(s).duration*.25);
    let created=false;
    if(!Number.isFinite(Number(pf.automationNextAt))){
      pf.automationNextAt=Math.max(floor,Number(s.cycle.time)||0);
      created=true;
    }
    pf.automationNextAt=Math.max(0,Number(pf.automationNextAt)||floor);
    return {pf,created};
  }
  const initialAutomationSchedule=ensureAutomationSchedule();
  if(initialAutomationSchedule?.created&&typeof save==='function')save();

  const originalAdvance=E.advance.bind(E);
  E.advance=function(s,seconds){
    const level=Number(s?.meta?.upgrades?.automation)||0;
    const since=s?.cycle?.events?.at(-1)?.seq||0;
    if(level>0)s.meta.upgrades.automation=0;
    let result;
    try{result=originalAdvance(s,seconds)}finally{if(level>0)s.meta.upgrades.automation=level}
    const repaired=L.repairAutoModuleSwaps(s,E,since);
    for(const r of repaired){
      if(typeof log==='function')log(`LOADOUT GUARD: auto-swap rejected; ${fmt(r.from)}/s → ${fmt(r.to)}/s retained`);
      if(typeof toast==='function')toast('loadout','LOADOUT GUARD','AUTO-SWAP REJECTED','Stored new Module because equipped throughput would fall.');
    }
    return result;
  };

  document.querySelectorAll('.machine').forEach(el=>el.addEventListener('keydown',e=>{if(e.target!==el||!['Enter',' '].includes(e.key))return;e.preventDefault();select(el.dataset.id)}));
  document.querySelectorAll('[data-upgrade-id]').forEach(btn=>btn.addEventListener('click',e=>{
    e.stopPropagation();if(state.cycle.ended||paused||introOpen)return;
    const id=btn.dataset.upgradeId,before=state.cycle.levels[id],tpBefore=E.throughput(state);select(id);centralUpgrade?.click();
    if(state.cycle.levels[id]!==before){
      const wrap=btn.closest('.machine-wrap'),scene=document.getElementById('factoryScene'),tpAfter=E.throughput(state);btn.classList.add('just-bought');wrap?.classList.add('upgrade-react');scene?.classList.add('line-react');
      if(tpAfter>tpBefore+L.EPS)document.querySelector('.topstats')?.classList.add('throughput-react');
      setTimeout(()=>{wrap?.classList.remove('upgrade-react');scene?.classList.remove('line-react');document.querySelector('.topstats')?.classList.remove('throughput-react')},520);
    }
  }));
  autoButtons.forEach(btn=>btn.addEventListener('click',()=>{
    const mode=btn.dataset.autoMode,level=Number(state.meta.upgrades.automation)||0;if(mode==='assist'&&level<1||mode==='smart'&&level<2)return;
    state.meta.automationMode=mode;save();log(`AUTOMATION MEMORY mode set to ${mode.toUpperCase()}`);renderAutomation();
  }));

  function renderAutomation(){
    ensureAutomationMode();const level=Number(state.meta.upgrades.automation)||0,mode=state.meta.automationMode;
    autoButtons.forEach(btn=>{const m=btn.dataset.autoMode,locked=m==='assist'&&level<1||m==='smart'&&level<2;btn.disabled=locked;btn.classList.toggle('active',m===mode);btn.setAttribute('aria-pressed',String(m===mode))});
    const status=document.getElementById('automationStatus');if(!status)return;
    if(level<=0)status.textContent='LOCKED // Install Automation Memory to delegate routine upgrades.';
    else if(mode==='off')status.textContent=`LV ${level} READY // No Credits will be spent automatically.`;
    else if(mode==='assist')status.textContent=`ASSIST // Current bottleneck only · keeps ~${Math.round(L.reserveRatio(level,'assist')*100)}% Credits in reserve.`;
    else status.textContent=`SMART // Evaluates immediate line gain · keeps ~${Math.round(L.reserveRatio(level,'smart')*100)}% Credits in reserve.`;
  }

  function maybeAutomate(){
    const schedule=ensureAutomationSchedule();
    const level=Number(state.meta.upgrades.automation)||0,mode=state.meta.automationMode;
    if(!schedule||level<=0||mode==='off'||state.cycle.ended||paused||introOpen||state.cycle.time+1e-9<schedule.pf.automationNextAt)return;
    const decision=L.chooseAutomationUpgrade(state,E,mode);
    schedule.pf.automationNextAt=state.cycle.time+(level>=3?7:10);
    if(!decision){save();return}
    const before=state.cycle.levels[decision.id];select(decision.id);centralUpgrade?.click();if(state.cycle.levels[decision.id]!==before)log(`AUTOMATION // ${E.STAGE_DEFS[decision.id].name} delegated upgrade · reserve ${Math.round(decision.reserve*100)}%`);else save();
  }

  function renderDirectUpgrades(){
    const bottleneck=E.rawBottleneck(state);
    document.querySelectorAll('[data-upgrade-id]').forEach(btn=>{
      const id=btn.dataset.upgradeId,out=L.upgradeOutcome(state,E,id),cost=out?.cost??E.cost(state,id),available=!!out?.available&&!paused&&!introOpen&&!state.cycle.ended;
      btn.disabled=!available;btn.classList.toggle('impact',available&&(out.gain>L.EPS||id===bottleneck));btn.classList.toggle('affordable',available&&out.gain<=L.EPS&&id!==bottleneck);
      const costEl=btn.querySelector('.upgrade-cost');if(costEl)costEl.textContent=fmt(cost);
      const label=`Upgrade ${E.STAGE_DEFS[id].name} for ${fmt(cost)} Credits`+(out?.gain>L.EPS?`; line +${fmt(out.gain)}/s`:'');btn.setAttribute('aria-label',label);btn.title=label;
      if(btn.classList.contains('just-bought'))requestAnimationFrame(()=>btn.classList.remove('just-bought'));
    });
    const analysis=document.querySelector('.upgrade');if(analysis){const caps=Object.keys(E.STAGE_DEFS).map(id=>({id,v:E.stageCapacity(state,id)})).sort((a,b)=>a.v-b.v),first=caps[0],second=caps[1];document.getElementById('selectedName').textContent=E.STAGE_DEFS[first.id].name;document.getElementById('selectedDesc').textContent=`Current line constraint. ${second?`Next constraint: ${E.STAGE_DEFS[second.id].name} ${fmt(second.v)}/s.`:''}`;document.getElementById('selectedCap').textContent=fmt(first.v)+'/s';document.getElementById('selectedCost').textContent=fmt(E.cost(state,first.id))}
  }

  function renderCheckpoints(){document.querySelectorAll('.milestone-row').forEach(row=>{const em=row.querySelector('em');if(!em)return;if(row.classList.contains('done'))em.textContent='CLEAR · +SALVAGE';else if(row.classList.contains('miss'))em.textContent='MISS · RUN CONTINUES';else if(row.classList.contains('current'))em.textContent='ACTIVE';else em.textContent='PENDING'})}
  function renderStatusLive(){
    if(!document.getElementById('statusLive'))return;const final=E.directivesFor(state).at(-1),remaining=Math.max(0,final.t-state.cycle.time),b=E.rawBottleneck(state);
    document.getElementById('statusLiveTime').textContent=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(Math.floor(remaining%60)).padStart(2,'0')}`;document.getElementById('statusLiveTp').textContent=`${fmt(E.throughput(state))} / ${fmt(final.target)}/s`;document.getElementById('statusLiveBottleneck').textContent=E.STAGE_DEFS[b].name;document.getElementById('statusLiveAutomation').textContent=(Number(state.meta.upgrades.automation)||0)>0?state.meta.automationMode.toUpperCase():'LOCKED';
  }

  function retainedCopy(meta=state.meta){
    const k=L.retainedKnowledgeSummary(meta,E);if(!k)return 'No retained knowledge.';
    const bits=[`ALL CAPACITY ×${k.capacity.toFixed(2)}`,`START ${k.startCredits.toFixed(0)} CR`,`${k.moduleSlots} BAYS`,`SALVAGE +${k.salvageBonus} BP`];
    if(k.powerBonus>L.EPS)bits.push(`POWER ×${k.powerPatent.toFixed(2)}`);if(k.automationLevel>0)bits.push(`AUTO ${k.automationModes.slice(1).join('/')}`);return bits.join(' · ');
  }
  function renderKnowledgeImpact(){
    const box=document.getElementById('knowledgeImpact');if(!box)return;const k=L.retainedKnowledgeSummary(state.meta,E),key=JSON.stringify([k.capacity,k.startCredits,k.moduleSlots,k.powerPatent,k.salvageBonus,k.automationLevel]);if(key===knowledgeKey)return;knowledgeKey=key;
    const items=[['STARTING CREDITS',`${k.baseStartCredits.toFixed(0)} → ${k.startCredits.toFixed(0)}`,k.startCreditBonus>0?`+${k.startCreditBonus.toFixed(0)} base credits`:'No capital bonus'],['ALL CAPACITY',`×1.00 → ×${k.capacity.toFixed(2)}`,k.capacityBonus>0?`+${Math.round(k.capacityBonus*100)}% retained efficiency`:'No efficiency bonus'],['MODULE BAYS',`2 → ${k.moduleSlots}`,k.extraModuleSlots>0?`+${k.extraModuleSlots} retained bay${k.extraModuleSlots===1?'':'s'}`:'Base loadout'],['AUTOMATION',k.automationLevel>0?k.automationModes.slice(1).join(' / '):'LOCKED',k.automationLevel>0?`LV ${k.automationLevel} · always starts under player control`:'Install Automation Memory to delegate routine work']];
    box.innerHTML='<span class="knowledge-impact-label">NEXT FOUNDRY // RETAINED ADVANTAGE</span><div class="knowledge-impact-grid">'+items.map(([name,value,copy])=>`<div><span>${name}</span><strong>${value}</strong><small>${copy}</small></div>`).join('')+'</div>';
  }

  function decorateModulePreviews(){
    if(document.getElementById('statusOverlay')?.hidden)return;const before=E.throughput(state);
    document.querySelectorAll('#moduleInventory button[data-uid][data-bay]').forEach(btn=>{
      if(btn.disabled)return;const p=L.modulePlacementPreview(state,E,btn.dataset.uid,Number(btn.dataset.bay));if(!p?.changed)return;const gain=p.gain,base=`BAY ${Number(btn.dataset.bay)+1}`;btn.textContent=gain>L.EPS?`${base} · +${fmt(gain)}/s`:gain<-L.EPS?`${base} · ${fmt(gain)}/s`: `${base} · line same`;btn.classList.toggle('preview-positive',gain>L.EPS);btn.classList.toggle('preview-negative',gain<-L.EPS);btn.title=`Line ${fmt(before)}/s → ${fmt(p.after)}/s`;
    });
  }

  function snapshotTransition(){transitionSnapshot={meta:clone(state.meta),era:Number(state.meta.era)||1,cycle:Number(state.meta.cycle)||1,retained:retainedCopy(state.meta)}}
  function showRebuildBanner(previous){
    const banner=document.getElementById('rebuildBanner');if(!banner)return;clearTimeout(rebuildBannerTimer);document.getElementById('rebuildBannerTitle').textContent=`FOUNDRY-${String(state.meta.cycle).padStart(2,'0')} ONLINE`;document.getElementById('rebuildBannerCopy').textContent=retainedCopy(state.meta);banner.hidden=false;banner.classList.remove('leaving');requestAnimationFrame(()=>banner.classList.add('shown'));rebuildBannerTimer=setTimeout(()=>{banner.classList.add('leaving');setTimeout(()=>{banner.hidden=true;banner.classList.remove('shown','leaving')},320)},5200);if(previous&&typeof toast==='function')toast('knowledge','REBUILD COMPLETE','RETAINED KNOWLEDGE ONLINE',retainedCopy(state.meta));
  }
  function showEraBriefing(previous){
    const overlay=document.getElementById('eraBriefOverlay'),era=E.currentEra(state),final=E.directivesFor(state).at(-1),protocol=protocolFallback[era.id]||protocolFallback[1];if(!overlay)return;
    paused=true;last=performance.now();document.getElementById('eraBriefEra').textContent=`ERA ${era.id} // ${era.name}`;document.getElementById('eraBriefTitle').textContent=`ENTER ${era.name}`;document.getElementById('eraBriefFocus').textContent=era.focus;document.getElementById('eraBriefTarget').textContent=`${fmt(final.target)} /s SUSTAINED`;document.getElementById('eraBriefDeadline').textContent=`DEADLINE ${Math.round(era.duration/60)}:00 AT ×1`;document.getElementById('eraBriefProtocol').textContent=protocol[0];document.getElementById('eraBriefProtocolCopy').textContent=protocol[1];document.getElementById('eraBriefRetained').textContent=retainedCopy(state.meta);overlay.hidden=false;render();document.getElementById('eraBriefBegin')?.focus();if(previous&&typeof log==='function')log(`ERA ${era.id} briefing ready // production clock halted`);
  }
  document.getElementById('eraBriefBegin')?.addEventListener('click',()=>{document.getElementById('eraBriefOverlay').hidden=true;paused=false;last=performance.now();log(`ERA ${state.meta.era} production authorized`);render()});
  document.getElementById('restartBtn')?.addEventListener('click',snapshotTransition,true);
  document.getElementById('restartBtn')?.addEventListener('click',()=>showRebuildBanner(transitionSnapshot));
  document.getElementById('advanceEraBtn')?.addEventListener('click',snapshotTransition,true);
  document.getElementById('advanceEraBtn')?.addEventListener('click',()=>showEraBriefing(transitionSnapshot));

  function refresh(){ensureAutomationMode();maybeAutomate();renderDirectUpgrades();renderAutomation();renderCheckpoints();renderStatusLive();renderKnowledgeImpact();decorateModulePreviews();requestAnimationFrame(refresh)}
  refresh();
})();