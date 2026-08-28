'use strict';
(()=>{
  const E=window.InfiniteFoundryEngine;
  if(!E)return;

  const ALLOWED_SPEEDS=[1,2,4,8];
  const originalDeserialize=E.deserialize.bind(E);
  E.deserialize=function(raw){
    let requested=1;
    try{
      const parsed=typeof raw==='string'?JSON.parse(raw):raw;
      requested=Number(parsed?.state?.cycle?.speed)||1;
    }catch(_){}
    const restored=originalDeserialize(raw);
    if(restored&&ALLOWED_SPEEDS.includes(requested))restored.cycle.speed=requested;
    return restored;
  };

  const speedBar=document.querySelector('.speed');
  if(speedBar&&!speedBar.querySelector('[data-speed="8"]')){
    const button=document.createElement('button');
    button.type='button';button.dataset.speed='8';button.textContent='×8';
    button.title='Fast-forward. The simulation still advances in fixed game-time steps.';
    button.addEventListener('click',()=>{if(typeof setSpeed==='function')setSpeed(8)});
    speedBar.append(button);
  }

  const helpArticles=Array.from(document.querySelectorAll('#helpOverlay .qa-grid article'));
  const speedHelp=helpArticles.find(article=>article.querySelector('h3')?.textContent?.includes('×1 / ×2 / ×4'));
  if(speedHelp){
    const h=speedHelp.querySelector('h3'),p=speedHelp.querySelector('p');
    h.textContent='×1 / ×2 / ×4 / ×8で有利不利は？';
    p.textContent='同じゲーム内時間ならsimulation結果は同じです。×8は待ち時間を飛ばすfast-forwardとして使えます。重要な操作が必要な区間では低速へ戻して構いません。';
  }

  function sync(){
    const speed=Number(state?.cycle?.speed)||1;
    document.querySelectorAll('.speed button[data-speed]').forEach(btn=>btn.classList.toggle('active',Number(btn.dataset.speed)===speed));
  }
  document.getElementById('restartBtn')?.addEventListener('click',()=>requestAnimationFrame(sync));
  document.getElementById('advanceEraBtn')?.addEventListener('click',()=>requestAnimationFrame(sync));
  sync();

  window.InfiniteFoundryM14={ALLOWED_SPEEDS,syncSpeedUI:sync};
})();
