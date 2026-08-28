'use strict';
(()=>{
  const E=window.InfiniteFoundryEngine;
  if(!E)return;

  const ALLOWED_SPEEDS=[1,2,4,8];
  function isEightUnlocked(meta){
    return (Number(meta?.upgrades?.automation)||0)>=1;
  }

  const originalDeserialize=E.deserialize.bind(E);
  E.deserialize=function(raw){
    let requested=1;
    try{
      const parsed=typeof raw==='string'?JSON.parse(raw):raw;
      requested=Number(parsed?.state?.cycle?.speed)||1;
    }catch(_){}
    const restored=originalDeserialize(raw);
    if(!restored)return restored;
    if(requested===8){
      restored.cycle.speed=isEightUnlocked(restored.meta)?8:4;
    }else if(ALLOWED_SPEEDS.includes(requested)){
      restored.cycle.speed=requested;
    }
    return restored;
  };

  const speedBar=document.querySelector('.speed');
  let eightButton=speedBar?.querySelector('[data-speed="8"]')||null;
  if(speedBar&&!eightButton){
    eightButton=document.createElement('button');
    eightButton.type='button';eightButton.dataset.speed='8';eightButton.textContent='×8';
    eightButton.addEventListener('click',()=>{
      if(!isEightUnlocked(state?.meta))return;
      if(typeof setSpeed==='function')setSpeed(8);
    });
    speedBar.append(eightButton);
  }

  const helpArticles=Array.from(document.querySelectorAll('#helpOverlay .qa-grid article'));
  const speedHelp=helpArticles.find(article=>article.querySelector('h3')?.textContent?.includes('×1 / ×2 / ×4'));
  if(speedHelp){
    const h=speedHelp.querySelector('h3'),p=speedHelp.querySelector('p');
    h.textContent='×1 / ×2 / ×4 / ×8で有利不利は？';
    p.textContent='同じゲーム内時間ならsimulation結果は同じです。×8はAUTOMATIONを獲得すると解放される高速周回用fast-forwardです。重要な操作が必要な区間では低速へ戻して構いません。';
  }

  function sync(){
    const speed=Number(state?.cycle?.speed)||1;
    const unlocked=isEightUnlocked(state?.meta);
    if(eightButton){
      eightButton.disabled=!unlocked;
      eightButton.classList.toggle('locked',!unlocked);
      eightButton.title=unlocked
        ?'Fast-forward. The simulation still advances in fixed game-time steps.'
        :'LOCKED // Acquire AUTOMATION to unlock ×8 fast-forward.';
      eightButton.setAttribute('aria-label',unlocked?'×8 fast-forward':'×8 fast-forward locked until Automation');
    }
    document.querySelectorAll('.speed button[data-speed]').forEach(btn=>btn.classList.toggle('active',Number(btn.dataset.speed)===speed));
  }
  document.getElementById('restartBtn')?.addEventListener('click',()=>requestAnimationFrame(sync));
  document.getElementById('advanceEraBtn')?.addEventListener('click',()=>requestAnimationFrame(sync));
  document.getElementById('upgradeList')?.addEventListener('click',()=>requestAnimationFrame(sync));
  sync();

  window.InfiniteFoundryM14={ALLOWED_SPEEDS,isEightUnlocked,syncSpeedUI:sync};
})();
