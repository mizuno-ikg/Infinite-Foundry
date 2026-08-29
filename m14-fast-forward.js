'use strict';
(()=>{
  const E=window.InfiniteFoundryEngine;
  if(!E)return;

  // M14 outcome: x8 was rejected by same-seed human-like routes. Keep this
  // compatibility layer only so experimental x8 saves degrade safely to x4.
  const ALLOWED_SPEEDS=[1,2,4];
  const originalDeserialize=E.deserialize.bind(E);
  E.deserialize=function(raw){
    let requested=1;
    try{
      const parsed=typeof raw==='string'?JSON.parse(raw):raw;
      requested=Number(parsed?.state?.cycle?.speed)||1;
    }catch(_){}
    const restored=originalDeserialize(raw);
    if(!restored)return restored;
    restored.cycle.speed=requested===8?4:(ALLOWED_SPEEDS.includes(requested)?requested:1);
    return restored;
  };

  // Defensive cleanup for cached/experimental markup. The shipping markup has
  // only x1/x2/x4, and no runtime path is allowed to re-introduce x8.
  document.querySelectorAll('.speed button[data-speed="8"]').forEach(btn=>btn.remove());

  function sync(){
    const speed=Number(state?.cycle?.speed)||1;
    document.querySelectorAll('.speed button[data-speed]').forEach(btn=>{
      btn.classList.toggle('active',Number(btn.dataset.speed)===speed);
    });
  }
  document.getElementById('restartBtn')?.addEventListener('click',()=>requestAnimationFrame(sync));
  document.getElementById('advanceEraBtn')?.addEventListener('click',()=>requestAnimationFrame(sync));
  sync();

  window.InfiniteFoundryM14={ALLOWED_SPEEDS,x8Removed:true,syncSpeedUI:sync};
})();
