'use strict';
(()=>{
  const L=window.InfiniteFoundryPlayfeelLogic;
  if(!L?.HOLD_TO_UPGRADE)return;
  const cfg=L.HOLD_TO_UPGRADE;

  const analysis=document.querySelector('.upgrade');
  if(analysis&&!analysis.querySelector('.direct-control-hint')){
    const hint=document.createElement('div');
    hint.className='direct-control-hint';
    hint.innerHTML='<strong>DIRECT CONTROL</strong><span>Tap UPGRADE once, or hold it to keep investing in that machine while you choose the target.</span>';
    analysis.appendChild(hint);
  }

  document.querySelectorAll('[data-upgrade-id]').forEach(btn=>{
    if(btn.dataset.holdUpgradeReady==='true')return;
    btn.dataset.holdUpgradeReady='true';
    let armTimer=0,repeatTimer=0,holding=false,suppressReleaseClick=false,synthetic=false,pointerId=null;

    const stop=()=>{
      clearTimeout(armTimer);clearInterval(repeatTimer);armTimer=0;repeatTimer=0;
      btn.classList.remove('hold-arming','hold-active');
      if(pointerId!==null&&btn.hasPointerCapture?.(pointerId)){
        try{btn.releasePointerCapture(pointerId)}catch(_){ }
      }
      pointerId=null;
    };
    const buy=()=>{
      if(btn.disabled){stop();return}
      synthetic=true;
      try{btn.click()}finally{synthetic=false}
      if(btn.disabled)stop();
    };

    btn.addEventListener('click',e=>{
      if(synthetic)return;
      if(suppressReleaseClick){
        suppressReleaseClick=false;e.preventDefault();e.stopImmediatePropagation();
      }
    },true);

    btn.addEventListener('pointerdown',e=>{
      if(btn.disabled||e.button!==0)return;
      stop();pointerId=e.pointerId;
      try{btn.setPointerCapture(e.pointerId)}catch(_){ }
      btn.classList.add('hold-arming');
      armTimer=setTimeout(()=>{
        if(btn.disabled)return stop();
        holding=true;suppressReleaseClick=true;btn.classList.remove('hold-arming');btn.classList.add('hold-active');
        buy();
        repeatTimer=setInterval(buy,cfg.repeatMs);
      },cfg.delayMs);
    });

    const release=()=>{if(holding)suppressReleaseClick=true;holding=false;stop()};
    btn.addEventListener('pointerup',release);
    btn.addEventListener('pointercancel',release);
    btn.addEventListener('contextmenu',e=>{if(holding)e.preventDefault()});
    btn.addEventListener('lostpointercapture',()=>{if(holding){holding=false;stop()}});
  });
})();