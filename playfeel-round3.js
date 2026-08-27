'use strict';
(()=>{
  const E=window.InfiniteFoundryEngine,L=window.InfiniteFoundryPlayfeelLogic;
  if(!E||!L)return;
  const scene=document.getElementById('factoryScene'),overclock=document.getElementById('overclock');

  function buildRound3UI(){
    if(scene&&!scene.querySelector('.factory-drive')){const d=document.createElement('div');d.className='factory-drive';d.setAttribute('aria-hidden','true');scene.prepend(d)}
    document.querySelectorAll('.machine-wrap').forEach(w=>{if(w.querySelector('.machine-growth'))return;const g=document.createElement('div');g.className='machine-growth';g.setAttribute('aria-hidden','true');g.innerHTML='<i></i><i></i><i></i>';w.appendChild(g)});
    if(overclock&&!document.getElementById('overclockCharges')){const p=document.createElement('div');p.id='overclockCharges';p.className='overclock-charges';p.setAttribute('aria-hidden','true');p.innerHTML='<i></i><i></i><i></i>';overclock.appendChild(p)}
    const qa=document.querySelector('.qa-grid article:nth-child(3) p');if(qa)qa.innerHTML='現在のBOTTLENECKを短時間+30%する<b>蓄積型CAPACITOR</b>です。最大3回分を貯められるので、READYになるたび押す必要はありません。締切前や投資の谷間など、効かせたい場面で使ってください。';
  }
  buildRound3UI();

  const advanceBeforeRound3=E.advance.bind(E);
  E.advance=function(s,seconds){L.syncOverclockCapacitor(s);const result=advanceBeforeRound3(s,seconds);L.syncOverclockCapacitor(s);return result};
  const pulseBeforeRound3=E.pulse.bind(E);
  E.pulse=function(s){
    if(!s?.cycle||s.cycle.ended)return false;
    L.syncOverclockCapacitor(s);
    if((Number(s.cycle.overclockUntil)||0)>=(Number(s.cycle.time)||0)+L.EPS)return false;
    const cap=L.ensureOverclockCapacitor(s);if(!cap||cap.charges<=0)return false;
    const previousReady=Number(s.cycle.overclockReady)||0;s.cycle.overclockReady=Math.min(previousReady,Number(s.cycle.time)||0);
    const ok=pulseBeforeRound3(s);
    if(!ok){s.cycle.overclockReady=previousReady;return false}
    if(!L.consumeOverclockCharge(s))return false;
    s.cycle.overclockUntil=Math.max(Number(s.cycle.overclockUntil)||0,(Number(s.cycle.time)||0)+L.OVERCLOCK_CAPACITOR.durationSeconds);
    return true;
  };

  let trackedCycle=state.meta.cycle,lastCheckpointCount=state.cycle.checkpointResults.length,checkpointTimer=0;
  function renderCapacitor(){
    if(!overclock)return;const r=L.overclockReadout(state);if(!r)return;
    const locked=state.cycle.ended||paused||introOpen,active=r.activeSeconds>L.EPS,usable=!locked&&r.ready;
    overclock.disabled=!usable;overclock.classList.toggle('cooldown',!usable&&!active);overclock.classList.toggle('capacitor-active',active);overclock.classList.toggle('capacitor-ready',usable);overclock.classList.toggle('capacitor-full',r.charges===r.maxCharges);
    const span=overclock.querySelector('span'),strong=overclock.querySelector('strong'),small=overclock.querySelector('small');if(span)span.textContent='OVERCLOCK CAPACITOR';
    if(strong)strong.textContent=state.cycle.ended?'CYCLE END':paused?'PAUSED':active?`ACTIVE ${r.activeSeconds.toFixed(1)}s`:`${r.charges}/${r.maxCharges} CHARGED`;
    if(small)small.textContent=active?'Current bottleneck boosted +30%.':r.charges===r.maxCharges?`Banked. Spend when timing matters · ${r.durationSeconds}s burst`:`Next charge ${Math.ceil(r.nextChargeIn)} game-sec · bank up to ${r.maxCharges}`;
    document.querySelectorAll('#overclockCharges i').forEach((pip,i)=>pip.classList.toggle('filled',i<r.charges));
  }

  function renderFactoryGrowth(){
    const final=E.directivesFor(state).at(-1),tp=E.sustainedAverage(state,30)||E.throughput(state),ratio=Math.max(0,Math.min(1.15,tp/final.target));if(scene){scene.style.setProperty('--factory-drive',Math.min(1,ratio).toFixed(3));scene.dataset.outputBand=ratio>=.78?'3':ratio>=.48?'2':ratio>=.18?'1':'0'}
    document.querySelectorAll('.machine-wrap').forEach(w=>{const id=w.querySelector('.machine')?.dataset.id;if(!id)return;const lv=Number(state.cycle.levels[id])||0,tier=lv>=12?3:lv>=7?2:lv>=3?1:0;w.dataset.levelTier=String(tier);w.querySelectorAll('.machine-growth i').forEach((pip,i)=>pip.classList.toggle('filled',i<tier))});
  }

  function checkpointFeedback(){
    if(state.meta.cycle!==trackedCycle){trackedCycle=state.meta.cycle;lastCheckpointCount=state.cycle.checkpointResults.length;return}
    if(state.cycle.checkpointResults.length<=lastCheckpointCount)return;const newest=state.cycle.checkpointResults.at(-1);lastCheckpointCount=state.cycle.checkpointResults.length;if(!scene||!newest?.clear)return;
    clearTimeout(checkpointTimer);scene.classList.remove('checkpoint-react');void scene.offsetWidth;scene.classList.add('checkpoint-react');checkpointTimer=setTimeout(()=>scene.classList.remove('checkpoint-react'),900);
  }

  function refresh(){renderCapacitor();renderFactoryGrowth();checkpointFeedback();requestAnimationFrame(refresh)}
  refresh();
})();