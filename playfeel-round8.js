'use strict';
(()=>{
  const overlays={
    help:{el:document.getElementById('helpOverlay'),triggers:['helpBtn','introHelpBtn']},
    status:{el:document.getElementById('statusOverlay'),triggers:['statusBtn','moduleFeed','resultStatusBtn']},
    era:{el:document.getElementById('eraBriefOverlay'),triggers:['advanceEraBtn']}
  };
  const openers=new Map();
  const focusSelector='button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  const visibleFocusable=overlay=>[...overlay.querySelectorAll(focusSelector)].filter(el=>{
    if(el.hidden||el.getAttribute('aria-hidden')==='true')return false;
    const style=getComputedStyle(el);return style.display!=='none'&&style.visibility!=='hidden';
  });
  const topOpenOverlay=()=>Object.values(overlays).map(x=>x.el).filter(Boolean).reverse().find(el=>!el.hidden)||null;
  const focusFactoryControl=()=>{
    const target=document.querySelector('.machine-upgrade.impact:not([disabled]),.machine-upgrade:not([disabled]),#overclock:not([disabled]),#pauseBtn:not([disabled])');
    target?.focus();
  };

  for(const [name,cfg] of Object.entries(overlays)){
    if(!cfg.el)continue;
    for(const id of cfg.triggers){
      document.getElementById(id)?.addEventListener('click',e=>{openers.set(name,e.currentTarget)},true);
    }
    let wasHidden=cfg.el.hidden;
    new MutationObserver(()=>{
      const hidden=cfg.el.hidden;
      if(hidden===wasHidden)return;
      wasHidden=hidden;
      if(!hidden){
        const focusables=visibleFocusable(cfg.el);
        requestAnimationFrame(()=>{
          if(cfg.el.hidden)return;
          const current=document.activeElement;
          if(!current||!cfg.el.contains(current))focusables[0]?.focus();
        });
        return;
      }
      requestAnimationFrame(()=>{
        if(topOpenOverlay())return;
        if(name==='era'){focusFactoryControl();return}
        const opener=openers.get(name);
        if(opener?.isConnected&&!opener.hidden&&!opener.disabled)opener.focus();
      });
    }).observe(cfg.el,{attributes:true,attributeFilter:['hidden']});
  }

  document.addEventListener('keydown',e=>{
    if(e.key!=='Tab')return;
    const overlay=topOpenOverlay();if(!overlay)return;
    const focusables=visibleFocusable(overlay);if(!focusables.length){e.preventDefault();overlay.focus?.();return}
    const first=focusables[0],last=focusables.at(-1),active=document.activeElement;
    if(e.shiftKey&&(active===first||!overlay.contains(active))){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&(active===last||!overlay.contains(active))){e.preventDefault();first.focus()}
  },true);

  // Dynamic controls are core gameplay controls, so expose their live state to assistive tech too.
  document.getElementById('automationStatus')?.setAttribute('aria-live','polite');
  document.getElementById('statusLive')?.setAttribute('aria-live','polite');

  const round9=document.createElement('script');round9.src='playfeel-round9.js';document.body.appendChild(round9);
})();