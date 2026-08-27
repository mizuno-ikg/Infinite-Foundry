'use strict';
(()=>{
  const L=window.InfiniteFoundryPlayfeelLogic;
  const overclock=document.getElementById('overclock');
  if(!L||!overclock)return;

  let before=null;
  overclock.addEventListener('click',()=>{
    const cap=state?.cycle?.playfeel?.overclockCapacitor;
    before={
      cycle:state?.meta?.cycle,
      charges:Number(cap?.charges),
      overclockUntil:Number(state?.cycle?.overclockUntil)||0
    };
  },true);

  overclock.addEventListener('click',()=>{
    if(!before||before.cycle!==state?.meta?.cycle)return;
    const cap=state?.cycle?.playfeel?.overclockCapacitor;
    const charges=Number(cap?.charges);
    const overclockUntil=Number(state?.cycle?.overclockUntil)||0;
    const spent=Number.isFinite(before.charges)&&Number.isFinite(charges)&&charges<before.charges;
    const activated=overclockUntil>before.overclockUntil+L.EPS;
    if(spent||activated){
      save();
      const saveState=document.getElementById('saveState');
      if(saveState)saveState.textContent='SAVED · OVERCLOCK';
    }
    before=null;
  });
})();
