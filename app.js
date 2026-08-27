'use strict';
const E=window.InfiniteFoundryEngine;
const SAVE_KEY='infinite-foundry-save-v1';
const stageText={
  source:['SOURCE','Input capacity. The slowest stage limits the entire foundry.'],
  process:['PROCESS','Conversion throughput. Heat and transformation determine usable feedstock.'],
  transfer:['TRANSFER','Logistics throughput. Material waiting in transit is production you do not own.'],
  assembly:['ASSEMBLY','Integration throughput. Finished output cannot exceed assembly capacity.'],
  power:['POWER','Energy support capacity. Every industrial layer depends on stable power.']
};
const storageState={available:true};
const finiteNonNegative=n=>Number.isFinite(Number(n))&&Number(n)>=0;
const $=id=>document.getElementById(id);
const fmt=n=>n<10?n.toFixed(2):n<100?n.toFixed(1):n<10000?Math.floor(n).toLocaleString():n.toExponential(2);

function isUsableState(s){
  try{
    const ids=Object.keys(E.STAGE_DEFS);
    if(!s||!s.meta||!s.cycle||!s.meta.upgrades||!s.meta.patentUpgrades||!s.cycle.levels)return false;
    if(!finiteNonNegative(s.meta.cycle)||!finiteNonNegative(s.meta.era)||!finiteNonNegative(s.meta.blueprints)||!finiteNonNegative(s.meta.patents))return false;
    if(!finiteNonNegative(s.cycle.time)||!finiteNonNegative(s.cycle.credits)||!finiteNonNegative(s.cycle.output))return false;
    if(!ids.every(id=>finiteNonNegative(s.cycle.levels[id])))return false;
    if(!Array.isArray(s.meta.completedEras)||!Array.isArray(s.meta.discoveredModules)||!Array.isArray(s.cycle.modules)||!Array.isArray(s.cycle.moduleInventory)||!Array.isArray(s.cycle.throughputSamples)||!Array.isArray(s.cycle.checkpointResults)||!Array.isArray(s.cycle.events))return false;
    return true;
  }catch(_){return false}
}
function load(){
  try{
    const raw=localStorage.getItem(SAVE_KEY),s=raw&&E.deserialize(raw);
    if(!isUsableState(s))return null;
    return s;
  }catch(_){storageState.available=false;return null}
}

let state=load()||E.createState(E.baseMeta(Date.now()));
let selected='source';
let last=performance.now(),lastSaveReal=performance.now(),lastResultKey='',lastEventSeq=state.cycle.events?.at(-1)?.seq||0;
let paused=false,introOpen=!state.meta.introSeen,resultScrolledKey='';

function save(){
  try{
    localStorage.setItem(SAVE_KEY,E.serialize(state));
    storageState.available=true;lastSaveReal=performance.now();$('saveState').textContent='SAVED';return true;
  }catch(_){
    storageState.available=false;lastSaveReal=performance.now();$('saveState').textContent='SAVE UNAVAILABLE';return false;
  }
}
function log(msg){
  const box=$('logLines'),d=document.createElement('div');d.className='log-line';
  d.innerHTML=`<b>${String(Math.floor(state.cycle.time)).padStart(3,'0')}s</b> // ${msg}`;
  box.prepend(d);while(box.children.length>9)box.lastChild.remove();
}
function toast(kind,title,headline,detail){
  const stack=$('toastStack'),d=document.createElement('div');d.className=`toast ${kind||''}`;
  d.innerHTML=`<span>${title}</span><strong>${headline}</strong><small>${detail||''}</small>`;
  stack.prepend(d);while(stack.children.length>4)stack.lastChild.remove();
  setTimeout(()=>{d.classList.add('leaving');setTimeout(()=>d.remove(),280)},4200);
}
function processEvents(){
  for(const e of state.cycle.events||[]){
    if(e.seq<=lastEventSeq)continue;lastEventSeq=e.seq;
    if(e.type==='moduleRecovered'){
      const action=e.action==='equipped'?`AUTO-EQUIPPED // BAY ${Number(e.bay)+1}`:e.action==='replaced'?`AUTO-SWAPPED // BAY ${Number(e.bay)+1}`:'STORED IN LOADOUT';
      log(`MODULE ${e.rarity}: ${e.name} // ${action}`);toast('module','MODULE RECOVERED',`${e.rarity} // ${e.name}`,`${e.effect} · ${action}`);
    }else if(e.type==='moduleEquipped'){
      log(`LOADOUT: ${e.name} equipped to BAY ${Number(e.bay)+1}`);toast('loadout','LOADOUT UPDATED',e.name,`${e.effect} · BAY ${Number(e.bay)+1}`);
    }else if(e.type==='directiveEvaluated')log(`${e.label}: ${e.clear?'CLEAR':'MISS'} ${fmt(e.value)}/${fmt(e.target)}/s`);
    else if(e.type==='automationUpgrade')log(`AUTOMATION MEMORY upgraded ${stageText[e.stage][0]} to LV ${e.level}`);
    else if(e.type==='metaUpgrade'){log(`${String(e.upgrade).toUpperCase()} blueprint installed`);toast('knowledge','PERMANENT KNOWLEDGE','BLUEPRINT INSTALLED',retainedSummaryText())}
    else if(e.type==='patentUpgrade'){log(`${String(e.upgrade).toUpperCase()} patent installed`);toast('knowledge','PERMANENT KNOWLEDGE','PATENT INSTALLED',retainedSummaryText())}
    else if(e.type==='eraCompleted')log(`ERA ${e.era} COMPLETE // +${e.patentsEarned} PATENT`);
    else if(e.type==='eraAdvanced')log(`new production domain initialized: ERA ${e.era}`);
    else if(e.type==='rebuild')log(`Foundry-${String(e.cycle).padStart(2,'0')} initialized with retained design knowledge`);
  }
}

function select(id){
  selected=id;document.querySelectorAll('.machine').forEach(x=>x.classList.toggle('selected',x.dataset.id===id));
  $('selectedName').textContent=stageText[id][0];$('selectedDesc').textContent=stageText[id][1];render();
}
function upgrade(){if(E.upgrade(state,selected)){log(`${stageText[selected][0]} upgraded to LV ${state.cycle.levels[selected]}`);save();render()}}
function pulse(){if(E.pulse(state))render()}
function setSpeed(v){state.cycle.speed=v;document.querySelectorAll('.speed button').forEach(x=>x.classList.toggle('active',Number(x.dataset.speed)===v));log(`simulation speed set to ×${v}`);save();render()}
function togglePause(force){
  if(state.cycle.ended||introOpen)return;
  paused=typeof force==='boolean'?force:!paused;last=performance.now();
  log(paused?'manual pause engaged':'manual pause released');render();
}

function renderMilestones(){
  const dirs=E.directivesFor(state),box=$('milestoneList');box.innerHTML='';
  dirs.forEach((m,i)=>{const r=state.cycle.checkpointResults.find(x=>x.index===i),current=!r&&state.cycle.time<m.t&&(i===0||state.cycle.time>=dirs[i-1].t);const row=document.createElement('div');row.className='milestone-row '+(r?.clear?'done':current?'current':r?'miss':'');row.innerHTML=`<i>${r?.clear?'✓':i+1}</i><div><strong>${m.label}</strong><small>${fmt(m.target)}/s @ ${Math.round(m.t)}s</small></div><em>${r?(r.clear?'CLEAR':'MISS'):'PENDING'}</em>`;box.append(row)})
}
function renderModules(){
  const slots=E.upgradeEffects(state.meta).moduleSlots,box=$('moduleSlots');box.innerHTML='';
  for(let i=0;i<slots;i++){
    const m=state.cycle.modules[i]||null,d=document.createElement('button');d.type='button';d.className='module-slot '+(m?'filled':'');d.addEventListener('click',openStatus);
    d.innerHTML=m?`<span>BAY ${i+1} · ${m.rarity}</span><strong>${m.name}</strong><small>${m.effect} · click for LOADOUT</small>`:`<span>BAY ${i+1} · EMPTY</span><strong>Awaiting recovery</strong><small>Recovered modules can be assigned in STATUS.</small>`;box.append(d);
  }
  const latest=state.cycle.moduleInventory.at(-1);$('moduleName').textContent=latest?latest.name:'No module recovered';
  const bay=latest?state.cycle.modules.findIndex(m=>m?.uid===latest.uid):-1;
  $('moduleEffect').textContent=latest?`${latest.effect} // ${bay>=0?`BAY ${bay+1}`:'stored'} · OPEN STATUS TO MANAGE LOADOUT`:'Automatic recovery. Open STATUS to manage loadout.';
}
function renderPatentUpgrades(){
  document.querySelectorAll('[data-patent-upgrade]').forEach(btn=>{const id=btn.dataset.patentUpgrade,d=E.PATENT_UPGRADES[id],lv=state.meta.patentUpgrades[id]||0;btn.querySelector('b').textContent=`LV ${lv}/${d.max}`;btn.querySelector('em').textContent=lv>=d.max?'MAX':'1 PT';btn.disabled=lv>=d.max||state.meta.patents<1})
}
function retainedSummaryText(){
  const m=state.meta,e=E.upgradeEffects(m);return `ALL CAPACITY ×${e.capacity.toFixed(2)} · POWER ×${e.powerPatent.toFixed(2)} · ${e.moduleSlots} MODULE BAYS · SALVAGE +${e.salvageBonus} BP`;
}
function renderPermanent(){
  const m=state.meta,e=E.upgradeEffects(m);$('statusHeadline').textContent=retainedSummaryText();
  const rows=[
    ['BLUEPRINT',`CORE EFFICIENCY · LV ${m.upgrades.efficiency}`,`ALL CAPACITY +${m.upgrades.efficiency*8}%`],
    ['BLUEPRINT',`STARTING CAPITAL · LV ${m.upgrades.capital}`,`BASE START +${m.upgrades.capital*8} CREDITS`],
    ['BLUEPRINT',`AUTOMATION MEMORY · LV ${m.upgrades.automation}`,m.upgrades.automation?`AUTO-INVEST LEVEL ${m.upgrades.automation}`:'AUTO-INVEST OFF'],
    ['BLUEPRINT',`MODULE BAYS · LV ${m.upgrades.moduleBay}`,`${e.moduleSlots} EQUIPMENT SLOTS`],
    ['PATENT',`POWER ROUTING · LV ${m.patentUpgrades.powerRouting}`,`POWER +${m.patentUpgrades.powerRouting*12}%`],
    ['PATENT',`SALVAGE THEORY · LV ${m.patentUpgrades.salvageTheory}`,`SALVAGE +${m.patentUpgrades.salvageTheory} BP / CYCLE`]
  ];
  $('permanentGrid').innerHTML=rows.map(([kind,name,effect])=>`<div><span>${kind}</span><strong>${name}</strong><small>${effect}</small></div>`).join('');
  $('metaWallet').textContent=`UNSPENT // ${m.blueprints} BP · ${m.patents} PT · CYCLE ${m.cycle} · HIGHEST ERA ${m.highestEra}`;
}
function renderLoadout(){
  const slots=E.upgradeEffects(state.meta).moduleSlots,bayBox=$('statusBays'),invBox=$('moduleInventory');bayBox.innerHTML='';invBox.innerHTML='';
  for(let i=0;i<slots;i++){
    const m=state.cycle.modules[i],d=document.createElement('div');d.className='loadout-bay '+(m?'filled':'');d.innerHTML=m?`<span>BAY ${i+1} · ${m.rarity}</span><strong>${m.name}</strong><small>${m.effect}</small>`:`<span>BAY ${i+1} · EMPTY</span><strong>No module equipped</strong><small>Select a recovered module from inventory.</small>`;bayBox.append(d);
  }
  if(!state.cycle.moduleInventory.length){invBox.innerHTML='<div class="empty-inventory"><strong>NO MODULES RECOVERED YET</strong><small>Recovery is automatic and never pauses production.</small></div>'}
  for(const m of state.cycle.moduleInventory){
    const current=state.cycle.modules.findIndex(x=>x?.uid===m.uid),row=document.createElement('div');row.className='inventory-row';
    const actions=Array.from({length:slots},(_,i)=>`<button type="button" data-uid="${m.uid}" data-bay="${i}" ${state.cycle.ended||current===i?'disabled':''}>${current===i?'EQUIPPED':`BAY ${i+1}`}</button>`).join('');
    row.innerHTML=`<div><span>${m.rarity} · ${current>=0?`EQUIPPED BAY ${current+1}`:'STORED'}</span><strong>${m.name}</strong><small>${m.effect}</small></div><div class="inventory-actions">${actions}</div>`;invBox.append(row);
  }
  invBox.querySelectorAll('button[data-uid]').forEach(btn=>btn.addEventListener('click',()=>{if(E.equipModule(state,btn.dataset.uid,Number(btn.dataset.bay))){save();render();renderStatus()}}));
  renderPermanent();
}
function renderStatus(){renderLoadout()}

function renderPrestige(){
  const p=$('prestigePanel'),r=state.cycle.result;if(!r){p.hidden=true;return}p.hidden=false;
  const key=`${state.meta.cycle}:${r.win}:${r.blueprintsEarned}:${state.meta.era}`;
  if(key!==lastResultKey){lastResultKey=key;log(r.win?'DIRECTIVE ACHIEVED — salvage complete':'DIRECTIVE FAILED — salvage complete');save()}
  $('resultTitle').textContent=r.win?(r.eraCompleted?'ERA DIRECTIVE ACHIEVED':'DIRECTIVE ACHIEVED'):'DIRECTIVE FAILED';$('resultTitle').className=r.win?'win':'fail';
  $('resultSummary').textContent=`Final sustained throughput ${fmt(r.average)}/s. Salvaged +${r.blueprintsEarned} Blueprint.${r.patentsEarned?` Era first-clear secured +${r.patentsEarned} Patent.`:''}`;
  const b=r.finalBottleneck||E.rawBottleneck(state),gap=Math.max(0,E.directivesFor(state).at(-1).target-r.average);$('resultReason').textContent=r.win?`Production mandate met. Final limiting stage: ${stageText[b][0]}.`:`Short by ${fmt(gap)}/s. Final bottleneck: ${stageText[b][0]}. Invest retained knowledge, then rebuild.`;
  $('retainedSummary').textContent=retainedSummaryText();$('blueprints').textContent=state.meta.blueprints;$('patents').textContent=state.meta.patents;$('cycleNo').textContent=state.meta.cycle+1;
  document.querySelectorAll('[data-meta-upgrade]').forEach(btn=>{const id=btn.dataset.metaUpgrade,lv=state.meta.upgrades[id],costs=E.UPGRADE_COSTS[id],c=costs[lv];btn.querySelector('b').textContent=`LV ${lv}`;btn.querySelector('em').textContent=c==null?'MAX':`${c} BP`;btn.disabled=c==null||state.meta.blueprints<c});renderPatentUpgrades();
  const adv=E.canAdvanceEra(state);$('advanceEraBtn').hidden=!adv;$('restartBtn').textContent=r.win&&!adv&&state.meta.era===7?'REBUILD FINAL FOUNDRY':r.win?'REBUILD CURRENT ERA':'DISMANTLE & BEGIN NEXT CYCLE';
  if(state.meta.endingUnlocked){$('endingPanel').hidden=false;$('endingEra').textContent='UNIVERSE IGNITION COMPLETE';$('endingCopy').textContent='The directive source is silent. The foundry has fabricated a stable successor universe. Production may continue, but the mandate is fulfilled.'}
  if(resultScrolledKey!==key){resultScrolledKey=key;requestAnimationFrame(()=>p.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}))}
}
function renderEraRail(){const box=$('eraRail');box.innerHTML='';for(let i=1;i<=7;i++){const e=E.ERA_DEFS[i],d=document.createElement('div');d.className='era-node '+(i<state.meta.era?'past':i===state.meta.era?'active':i<=state.meta.highestEra?'unlocked':'');d.innerHTML=`<i>${i}</i><span>${e.name}</span>`;box.append(d)}}
function render(){
  processEvents();const era=E.currentEra(state),dirs=E.directivesFor(state),final=dirs.at(-1),tp=E.throughput(state),b=E.rawBottleneck(state),remaining=Math.max(0,final.t-state.cycle.time);document.body.dataset.era=era.id;
  $('eraLabel').textContent=`ERA ${era.id} // ${era.name}`;$('foundryTitle').textContent=`Foundry-${String(state.meta.cycle).padStart(2,'0')} / ${era.site}`;$('eraFocus').textContent=era.focus;$('directiveName').textContent=era.directive;$('directiveTarget').textContent=`${fmt(final.target)} /s sustained`;$('throughput').textContent=fmt(tp);$('credits').textContent=fmt(state.cycle.credits);$('clock').textContent=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(Math.floor(remaining%60)).padStart(2,'0')}`;$('cycleBadge').textContent=`CYCLE ${String(state.meta.cycle).padStart(2,'0')}`;$('bpBadge').textContent=`BP ${state.meta.blueprints}`;$('ptBadge').textContent=`PT ${state.meta.patents}`;
  const progress=Math.min(100,E.sustainedAverage(state,30)/final.target*100);$('directiveFill').style.width=progress+'%';$('directivePct').textContent=Math.floor(progress)+'%';$('bottleneckLabel').textContent=`${stageText[b][0]} // ${fmt(E.stageCapacity(state,b))}/s`;
  document.querySelectorAll('.machine').forEach(el=>{const id=el.dataset.id,lv=state.cycle.levels[id];el.classList.toggle('bottleneck',id===b);el.classList.toggle('level-high',lv>=6);el.querySelector('strong').textContent=fmt(E.stageCapacity(state,id));el.querySelector('em').textContent='LV '+lv});
  $('selectedCap').textContent=fmt(E.stageCapacity(state,selected))+'/s';$('selectedCost').textContent=fmt(E.cost(state,selected));$('upgradeBtn').disabled=!E.canUpgrade(state,selected)||paused||introOpen;
  const ready=Math.max(0,state.cycle.overclockReady-state.cycle.time),oc=$('overclock');oc.classList.toggle('cooldown',ready>0||state.cycle.ended||paused||introOpen);oc.disabled=ready>0||state.cycle.ended||paused||introOpen;oc.querySelector('strong').textContent=state.cycle.ended?'CYCLE END':paused?'PAUSED':ready>0?ready.toFixed(1)+'s':'READY';
  renderMilestones();renderModules();renderEraRail();renderPrestige();
  const status=document.querySelector('.status'),statusText=status.querySelector('span');statusText.textContent=state.cycle.ended?(state.cycle.result.win?'DIRECTIVE CLEAR':'SALVAGE'):paused?'PAUSED':'ONLINE';status.classList.toggle('failed',state.cycle.ended&&!state.cycle.result.win);status.classList.toggle('paused',paused);
  $('pausePlate').hidden=!paused;$('pauseBtn').textContent=paused?'RESUME':'PAUSE';$('pauseBtn').setAttribute('aria-pressed',String(paused));$('pauseBtn').disabled=state.cycle.ended||introOpen;
  $('saveState').textContent=!storageState.available?'SAVE UNAVAILABLE':performance.now()-lastSaveReal<1500?'SAVED':'AUTO-SAVE';
  if(!$('statusOverlay').hidden)renderStatus();
}

function buyMeta(id){if(E.buyMetaUpgrade(state,id)){save();render()}}
function buyPatent(id){if(E.buyPatentUpgrade(state,id)){save();render()}}
function restart(advanceEra=false){state=E.restart(state,advanceEra);lastResultKey='';resultScrolledKey='';lastEventSeq=0;last=performance.now();paused=false;save();select('source');render();window.scrollTo({top:0,behavior:'auto'})}

function showIntro(){
  const era=E.currentEra(state),final=E.directivesFor(state).at(-1);introOpen=true;$('introOverlay').hidden=false;$('introEra').textContent=`ERA ${era.id} // ${era.name}`;$('introDirective').textContent=era.directive;$('introTarget').textContent=`REACH ${fmt(final.target)} /s SUSTAINED`;$('introDeadline').textContent=`DEADLINE ${Math.round(era.duration/60)}:00 AT ×1`;last=performance.now();render();
}
function closeIntro(markSeen=true){
  if(markSeen){state.meta.introSeen=true;save();log('PRODUCTION DIRECTIVE ACCEPTED');log('FOUNDRY-01 IGNITION')}
  introOpen=false;$('introOverlay').hidden=true;last=performance.now();render();
}
function openHelp(){$('helpOverlay').hidden=false;$('helpClose').focus()}
function closeHelp(){$('helpOverlay').hidden=true;(introOpen?$('introHelpBtn'):$('helpBtn')).focus()}
function openStatus(){$('statusOverlay').hidden=false;renderStatus();$('statusClose').focus()}
function closeStatus(){$('statusOverlay').hidden=true;$('statusBtn').focus()}

function tick(now){
  const real=Math.min(.25,(now-last)/1000);last=now;
  if(!document.hidden&&!state.cycle.ended&&!paused&&!introOpen){E.advance(state,real*state.cycle.speed);if(now-lastSaveReal>5000)save()}
  render();requestAnimationFrame(tick);
}

document.querySelectorAll('.machine').forEach(el=>el.addEventListener('click',()=>select(el.dataset.id)));
$('upgradeBtn').addEventListener('click',upgrade);$('overclock').addEventListener('click',pulse);document.querySelectorAll('.speed button').forEach(btn=>btn.addEventListener('click',()=>setSpeed(Number(btn.dataset.speed))));document.querySelectorAll('[data-meta-upgrade]').forEach(btn=>btn.addEventListener('click',()=>buyMeta(btn.dataset.metaUpgrade)));document.querySelectorAll('[data-patent-upgrade]').forEach(btn=>btn.addEventListener('click',()=>buyPatent(btn.dataset.patentUpgrade)));
$('restartBtn').addEventListener('click',()=>restart(false));$('advanceEraBtn').addEventListener('click',()=>restart(true));$('resultStatusBtn').addEventListener('click',openStatus);$('moduleFeed').addEventListener('click',openStatus);$('statusBtn').addEventListener('click',openStatus);$('statusClose').addEventListener('click',closeStatus);$('pauseBtn').addEventListener('click',()=>togglePause());$('helpBtn').addEventListener('click',openHelp);$('introHelpBtn').addEventListener('click',openHelp);$('helpClose').addEventListener('click',closeHelp);$('helpDone').addEventListener('click',closeHelp);$('beginBtn').addEventListener('click',()=>closeIntro(true));$('manualSave').addEventListener('click',save);
$('resetSave').addEventListener('click',()=>{if(confirm('Erase all Infinite Foundry progress?')){try{localStorage.removeItem(SAVE_KEY)}catch(_){storageState.available=false}state=E.createState(E.baseMeta(Date.now()));save();location.reload()}});
for(const overlay of [$('helpOverlay'),$('statusOverlay')])overlay.addEventListener('click',e=>{if(e.target===overlay){if(overlay===$('helpOverlay'))closeHelp();else closeStatus()}});
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(!$('helpOverlay').hidden)closeHelp();else if(!$('statusOverlay').hidden)closeStatus()});
document.addEventListener('visibilitychange',()=>{last=performance.now();if(document.hidden){save();log('simulation paused: tab hidden')}else log('simulation resumed: no catch-up applied')});window.addEventListener('beforeunload',save);

log(`Foundry-${String(state.meta.cycle).padStart(2,'0')} online`);log('No offline progress. Factory runs only while visible.');if(!storageState.available)log('Persistent save unavailable in this browser session.');setSpeed(state.cycle.speed||1);select('source');if(introOpen)showIntro();requestAnimationFrame(tick);
