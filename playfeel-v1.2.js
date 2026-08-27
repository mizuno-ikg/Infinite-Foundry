'use strict';
(()=>{
  const E=window.InfiniteFoundryEngine,L=window.InfiniteFoundryPlayfeelLogic;
  if(!E||!L)return;

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
    const qa=document.querySelector('.qa-grid');
    if(qa&&!qa.querySelector('[data-playfeel-help="automation"]')){const a=document.createElement('article');a.dataset.playfeelHelp='automation';a.innerHTML='<h3>Automation Memoryとは？</h3><p>転生で解禁する「単純作業を委譲する権限」です。購入しただけでは自動消費せず初期状態は<b>OFF</b>。ASSIST / SMARTを自分で有効化した時だけCreditsを使います。</p>';qa.append(a);const c=document.createElement('article');c.dataset.playfeelHelp='checkpoint';c.innerHTML='<h3>CHECKPOINTは必須？</h3><p>いいえ。途中CHECKPOINTは進捗目安とSalvage報酬に影響します。MISSしても周回は続き、勝敗は最後の<b>FINAL DIRECTIVE</b>だけで決まります。</p>';qa.append(c)}
    const autoMeta=document.querySelector('[data-meta-upgrade="automation"] small');if(autoMeta)autoMeta.textContent='Unlock player-controlled routine automation. Default OFF.';
    const footer=document.querySelector('footer>span');if(footer)footer.textContent='VERSION 1.2 DEV // playfeel iteration';
  }
  buildUI();

  const centralUpgrade=document.getElementById('upgradeBtn');
  const autoButtons=[...document.querySelectorAll('[data-auto-mode]')];
  let autoCycle=state.meta.cycle;
  let nextAutomationAt=Math.max(75,E.currentEra(state).duration*.25);

  function ensureAutomationMode(){
    const level=Number(state.meta.upgrades.automation)||0;
    if(!['off','assist','smart'].includes(state.meta.automationMode))state.meta.automationMode='off';
    if(level<1&&state.meta.automationMode!=='off')state.meta.automationMode='off';
    if(level<2&&state.meta.automationMode==='smart')state.meta.automationMode='assist';
  }
  ensureAutomationMode();

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
    const id=btn.dataset.upgradeId,before=state.cycle.levels[id];select(id);centralUpgrade?.click();if(state.cycle.levels[id]!==before)btn.classList.add('just-bought');
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
    if(state.meta.cycle!==autoCycle){autoCycle=state.meta.cycle;nextAutomationAt=Math.max(75,E.currentEra(state).duration*.25)}
    const level=Number(state.meta.upgrades.automation)||0,mode=state.meta.automationMode;
    if(level<=0||mode==='off'||state.cycle.ended||paused||introOpen||state.cycle.time+1e-9<nextAutomationAt)return;
    const decision=L.chooseAutomationUpgrade(state,E,mode);nextAutomationAt=state.cycle.time+(level>=3?7:10);if(!decision)return;
    const before=state.cycle.levels[decision.id];select(decision.id);centralUpgrade?.click();if(state.cycle.levels[decision.id]!==before)log(`AUTOMATION // ${E.STAGE_DEFS[decision.id].name} delegated upgrade · reserve ${Math.round(decision.reserve*100)}%`);
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
  function refresh(){ensureAutomationMode();maybeAutomate();renderDirectUpgrades();renderAutomation();renderCheckpoints();renderStatusLive();requestAnimationFrame(refresh)}
  refresh();
})();
