'use strict';
(()=>{
  const E=window.InfiniteFoundryEngine;
  if(!E)return;

  // M14 outcome: x8 was rejected by same-seed human-like routes. Shipping
  // speeds are x1/x2/x4 only. Engine.deserialize already normalizes any
  // unsupported/experimental saved speed to x1 before app startup.
  const ALLOWED_SPEEDS=[1,2,4];

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
