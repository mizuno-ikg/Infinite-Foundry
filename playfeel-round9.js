'use strict';
(()=>{
  const E=window.InfiniteFoundryEngine;
  if(!E)return;
  const central=document.getElementById('upgradeBtn');
  if(!central)return;

  // Delegated automation should spend in the background without moving the player's
  // working context. Track only explicit player target changes; programmatic select()
  // calls used by automation never touch this value.
  let playerSelection=typeof selected==='string'?selected:'source';
  let directIntentDepth=0;
  const remember=id=>{if(E.STAGE_DEFS?.[id])playerSelection=id};

  document.querySelectorAll('.machine[data-id]').forEach(machine=>{
    machine.addEventListener('click',()=>remember(machine.dataset.id),true);
    machine.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key))remember(machine.dataset.id)},true);
  });
  document.querySelectorAll('[data-upgrade-id]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      remember(btn.dataset.upgradeId);
      directIntentDepth++;
      queueMicrotask(()=>{directIntentDepth=Math.max(0,directIntentDepth-1)});
    },true);
  });

  central.addEventListener('click',e=>{
    // A trusted legacy central-button click or a direct machine-button delegation is
    // player intent. The remaining programmatic path is Automation Memory.
    if(e.isTrusted||directIntentDepth>0)return;
    const level=Number(state?.meta?.upgrades?.automation)||0;
    const mode=state?.meta?.automationMode||'off';
    if(level<=0||mode==='off'||state?.cycle?.ended)return;

    const target=typeof selected==='string'?selected:null;
    if(!target||!E.STAGE_DEFS?.[target])return;
    const beforeLevel=Number(state.cycle.levels[target])||0;
    const cost=E.cost(state,target);
    const restore=playerSelection;

    queueMicrotask(()=>{
      const afterLevel=Number(state.cycle.levels[target])||0;
      if(afterLevel<=beforeLevel)return;

      // Restore the player's last explicitly chosen machine before the browser paints.
      // This keeps delegated control from visually steering the player's attention.
      if(restore&&restore!==selected&&E.STAGE_DEFS?.[restore])select(restore);

      // Make resource consumption auditable without adding another toast. Enrich the
      // existing automation log entry with exact spend and resulting level.
      const line=[...document.querySelectorAll('#logLines .log-line')].find(x=>x.textContent.includes('AUTOMATION //'));
      if(line&&!line.textContent.includes(' CR · LV '))line.append(document.createTextNode(` · -${fmt(cost)} CR · LV ${afterLevel}`));
    });
  },true);
})();