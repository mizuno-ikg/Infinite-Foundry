'use strict';
(()=>{
  const E=window.InfiniteFoundryEngine;
  if(!E)return;
  const overlay=document.getElementById('eraBriefOverlay');
  const advance=document.getElementById('advanceEraBtn');
  const begin=document.getElementById('eraBriefBegin');
  if(!overlay||!advance||!begin)return;

  const protocolFallback={
    1:['MANUAL DISCIPLINE','Identify and relieve the live bottleneck.'],
    2:['AUTONOMOUS RECLAIM','Correct bottleneck investment returns part of its cost.'],
    3:['LOGISTICS DIVIDEND','TRANSFER investment is subsidized by district reuse.'],
    4:['ORBITAL COUPLING','SOURCE and TRANSFER perform best when developed together.'],
    5:['THERMAL BANK','PROCESS / POWER investment stores longer Overclock bursts.'],
    6:['LAW SYMMETRY','Balanced stage levels recover part of their investment.'],
    7:['GENESIS RESONANCE','Raising every production layer releases creation grants.']
  };

  function cyclePlayfeel(){
    if(!state?.cycle)return null;
    if(!state.cycle.playfeel)state.cycle.playfeel={};
    return state.cycle.playfeel;
  }
  function retainedText(){
    const L=window.InfiniteFoundryPlayfeelLogic;
    if(!L)return 'Retained knowledge online.';
    const k=L.retainedKnowledgeSummary(state.meta,E);
    const bits=[`ALL CAPACITY ×${k.capacity.toFixed(2)}`,`START ${k.startCredits.toFixed(0)} CR`,`${k.moduleSlots} BAYS`,`SALVAGE +${k.salvageBonus} BP`];
    if(k.powerBonus>L.EPS)bits.push(`POWER ×${k.powerPatent.toFixed(2)}`);
    if(k.automationLevel>0)bits.push(`AUTO ${k.automationModes.slice(1).join('/')}`);
    return bits.join(' · ');
  }
  function restoreBriefing(){
    const pf=cyclePlayfeel();
    if(!pf?.eraBriefPending||state.cycle.ended)return false;
    const era=E.currentEra(state),final=E.directivesFor(state).at(-1),protocol=protocolFallback[era.id]||protocolFallback[1];
    paused=true;last=performance.now();
    document.getElementById('eraBriefEra').textContent=`ERA ${era.id} // ${era.name}`;
    document.getElementById('eraBriefTitle').textContent=`ENTER ${era.name}`;
    document.getElementById('eraBriefFocus').textContent=era.focus;
    document.getElementById('eraBriefTarget').textContent=`${fmt(final.target)} /s SUSTAINED`;
    document.getElementById('eraBriefDeadline').textContent=`DEADLINE ${Math.round(era.duration/60)}:00 AT ×1`;
    document.getElementById('eraBriefProtocol').textContent=protocol[0];
    document.getElementById('eraBriefProtocolCopy').textContent=protocol[1];
    document.getElementById('eraBriefRetained').textContent=retainedText();
    overlay.hidden=false;render();requestAnimationFrame(()=>begin.focus());
    return true;
  }

  // The base restart() saves the new Era before the briefing UI opens. Persist a
  // second, explicit state marker immediately after that transition so reload cannot
  // turn reading the briefing into a hidden time penalty or bypass it entirely.
  advance.addEventListener('click',()=>queueMicrotask(()=>{
    if(overlay.hidden||state.cycle.ended)return;
    const pf=cyclePlayfeel();if(!pf)return;
    pf.eraBriefPending=true;save();
  }));

  begin.addEventListener('click',()=>{
    const pf=cyclePlayfeel();if(!pf)return;
    pf.eraBriefPending=false;save();
  });

  if(cyclePlayfeel()?.eraBriefPending)restoreBriefing();
})();