'use strict';
(()=>{
  const E=window.InfiniteFoundryEngine;
  if(!E)return;
  const scene=document.getElementById('factoryScene');
  const directiveCopy=document.querySelector('.directive-copy');
  const helpOverlay=document.getElementById('helpOverlay');
  const eraBrief=document.getElementById('eraBriefOverlay');
  const automationPanel=document.getElementById('automationPanel');

  if(directiveCopy&&!directiveCopy.querySelector('.final-goal-kicker')){
    const kicker=document.createElement('span');
    kicker.className='final-goal-kicker';
    kicker.textContent='FINAL GOAL // FINAL DIRECTIVE DECIDES SUCCESS';
    directiveCopy.prepend(kicker);
  }

  let helpAutoPaused=false;
  const armHelpPause=()=>{
    if(introOpen||paused||state.cycle.ended)return;
    helpAutoPaused=true;
    togglePause(true);
  };
  for(const id of ['helpBtn','introHelpBtn'])document.getElementById(id)?.addEventListener('click',armHelpPause,true);

  if(helpOverlay){
    new MutationObserver(()=>{
      if(!helpOverlay.hidden||!helpAutoPaused)return;
      helpAutoPaused=false;
      if(paused&&!introOpen&&!state.cycle.ended)togglePause(false);
    }).observe(helpOverlay,{attributes:true,attributeFilter:['hidden']});
  }

  function syncVisualState(){
    if(scene){
      const halted=!!(paused||introOpen||document.hidden||(eraBrief&&!eraBrief.hidden));
      scene.classList.toggle('visual-halt',halted);
      scene.dataset.simSpeed=String(Number(state.cycle.speed)||1);
    }
    if(automationPanel){
      const level=Number(state.meta.upgrades.automation)||0;
      const mode=level>0?(state.meta.automationMode||'off'):'locked';
      automationPanel.classList.toggle('automation-locked',level<=0);
      automationPanel.classList.toggle('automation-off',level>0&&mode==='off');
      automationPanel.classList.toggle('automation-active',level>0&&mode!=='off');
    }
  }

  document.addEventListener('visibilitychange',syncVisualState);
  document.getElementById('pauseBtn')?.addEventListener('click',()=>requestAnimationFrame(syncVisualState));
  document.querySelectorAll('.speed button').forEach(btn=>btn.addEventListener('click',()=>requestAnimationFrame(syncVisualState)));
  document.querySelectorAll('[data-auto-mode]').forEach(btn=>btn.addEventListener('click',()=>requestAnimationFrame(syncVisualState)));
  if(eraBrief)new MutationObserver(syncVisualState).observe(eraBrief,{attributes:true,attributeFilter:['hidden']});
  setInterval(syncVisualState,500);
  syncVisualState();

  const round6=document.createElement('link');
  round6.rel='stylesheet';
  round6.href='playfeel-round6.css';
  document.head.appendChild(round6);
})();