'use strict';
(()=>{
  const scene=document.getElementById('factoryScene');
  if(!scene)return;
  const world=document.createElement('div');
  world.className='era-world';
  world.setAttribute('aria-hidden','true');
  world.innerHTML=`
    <div class="era-horizon"></div>
    <div class="era-structure era-gantry tier-1"></div>
    <div class="era-structure era-tower tower-a tier-1"></div>
    <div class="era-structure era-tower tower-b tier-2"></div>
    <div class="era-structure era-tower tower-c tier-3"></div>
    <div class="era-city"></div>
    <div class="era-planet"></div>
    <div class="era-elevator"></div>
    <div class="era-star"></div>
    <div class="era-orbit"></div>
    <div class="era-rift"></div>
    <div class="era-universe"></div>`;
  scene.prepend(world);

  const qaRequested=Number(new URLSearchParams(location.search).get('qaEra'));
  const qaEra=(location.hostname==='127.0.0.1'||location.hostname==='localhost')&&qaRequested>=1&&qaRequested<=7?qaRequested:0;
  if(qaEra){
    state.meta.era=qaEra;state.meta.highestEra=7;state.meta.introSeen=true;state.cycle.speed=1;
    state.cycle.levels={source:6,process:6,transfer:6,assembly:6,power:6};
    state.cycle.time=Math.min(E.currentEra(state).duration*.42,E.currentEra(state).duration-35);
    if(typeof closeIntro==='function')closeIntro(false);
    render();
  }

  const identities={
    1:{source:['⛏','SOURCE','Input'],process:['♨','PROCESS','Conversion'],transfer:['⇢','TRANSFER','Logistics'],assembly:['⚙','ASSEMBLY','Integration'],power:['ϟ','POWER','Energy grid']},
    2:{source:['▣','FEED ARRAY','Auto intake'],process:['⌬','ROBOT CELLS','Continuous conversion'],transfer:['⇶','SMART BELTS','Synced logistics'],assembly:['⚙','AUTO ASSEMBLY','Machine integration'],power:['ϟ','GRID CORE','Load routing']},
    3:{source:['▥','RESOURCE HUB','District intake'],process:['▤','REFINERY BLOCK','City processing'],transfer:['⇉','FREIGHT SPINE','Metro logistics'],assembly:['▦','MEGAPLANT','Mass integration'],power:['ϟ','CITY GRID','Urban energy']},
    4:{source:['◉','CRUST MINES','Planetary intake'],process:['◌','MANTLE WORKS','Deep conversion'],transfer:['↥','ORBITAL LIFT','Surface-to-orbit'],assembly:['◇','ORBITAL YARD','Planet-scale integration'],power:['ϟ','PLANET GRID','Global energy']},
    5:{source:['✦','STELLAR FEED','Matter capture'],process:['☀','FUSION FORGE','Star processing'],transfer:['⌒','DYSON RELAY','Collector logistics'],assembly:['✧','STAR FOUNDRY','Stellar integration'],power:['ϟ','SOLAR CORE','Captive-star energy']},
    6:{source:['λ','FIELD SOURCE','Law substrate'],process:['∫','CONSTANT PRESS','Rule transformation'],transfer:['⇌','CAUSAL LINK','State transfer'],assembly:['Ω','LAW ENGINE','Reality integration'],power:['ϟ','VACUUM GRID','Field energy']},
    7:{source:['✺','PRIME MATTER','Genesis feed'],process:['◎','COSMIC FURNACE','Universe formation'],transfer:['∞','SPACETIME WEAVE','Cosmic transport'],assembly:['◈','GENESIS ARRAY','Universe integration'],power:['ϟ','IGNITION CORE','Creation energy']}
  };

  const mechanicsScript=document.createElement('script');
  mechanicsScript.src='era-mechanics.js';
  mechanicsScript.onload=()=>setupProtocols(window.InfiniteFoundryEraMechanics);
  document.head.append(mechanicsScript);

  function setupProtocols(M){
    if(!M)return;
    const style=document.createElement('style');
    style.textContent=`.domain-protocol{border-top:1px solid #2d3940;padding-top:12px}.domain-protocol h3{font-size:12px;letter-spacing:.08em;margin:5px 0;color:var(--cyan)}.domain-protocol p{font-size:10px;line-height:1.45;color:#9aaab2;margin:0 0 7px}.protocol-status{display:block;border-left:2px solid var(--amber);padding:5px 7px;background:#0a1013;color:#c8d2d6;font-size:9px}.protocol-flash{animation:protocolFlash .45s ease-out}@keyframes protocolFlash{0%{box-shadow:inset 0 0 28px rgba(255,170,70,.35)}100%{box-shadow:none}}@media(prefers-reduced-motion:reduce){.protocol-flash{animation:none}}`;
    document.head.append(style);
    const section=document.createElement('section');section.className='domain-protocol';section.innerHTML='<span class="eyebrow">DOMAIN PROTOCOL</span><h3 id="protocolName"></h3><p id="protocolCopy"></p><span class="protocol-status" id="protocolStatus"></span>';
    const modules=document.querySelector('.side .modules');modules?.before(section);
    const upgradeBtn=document.getElementById('upgradeBtn'),pulseBtn=document.getElementById('overclock');
    let upgradeCtx=null,pulseCtx=null,lastCycle=state.meta.cycle,lastCheckpointSeen=state.cycle.checkpointResults.length,lastEra=state.meta.era;
    upgradeBtn?.addEventListener('click',()=>{upgradeCtx={id:selected,level:state.cycle.levels[selected],cost:E.cost(state,selected),was:E.rawBottleneck(state)===selected}},true);
    upgradeBtn?.addEventListener('click',()=>{if(!upgradeCtx||state.cycle.levels[upgradeCtx.id]===upgradeCtx.level)return;const r=M.afterUpgrade(state,upgradeCtx.id,upgradeCtx.cost,upgradeCtx.was);if(r.message){log(`${M.describe(state).name}: ${r.message}${r.rebate?` +${fmt(r.rebate)} CR`:''}`);flashProtocol();save()}upgradeCtx=null});
    pulseBtn?.addEventListener('click',()=>{pulseCtx={ready:state.cycle.overclockReady,time:state.cycle.time}},true);
    pulseBtn?.addEventListener('click',()=>{if(!pulseCtx||state.cycle.overclockReady===pulseCtx.ready)return;const r=M.afterPulse(state);if(r.message){log(r.message);flashProtocol();save()}pulseCtx=null});
    function flashProtocol(){section.classList.remove('protocol-flash');void section.offsetWidth;section.classList.add('protocol-flash')}
    function refreshProtocol(){
      if(state.meta.cycle!==lastCycle){lastCycle=state.meta.cycle;lastCheckpointSeen=state.cycle.checkpointResults.length}
      if(state.meta.era!==lastEra){lastEra=state.meta.era;lastCheckpointSeen=state.cycle.checkpointResults.length}
      while(lastCheckpointSeen<state.cycle.checkpointResults.length){const r=state.cycle.checkpointResults[lastCheckpointSeen++];log(`ARCHIVE: ${M.storyFor(state,r.index,r.clear)}`)}
      const d=M.describe(state);document.getElementById('protocolName').textContent=d.name;document.getElementById('protocolCopy').textContent=d.copy;document.getElementById('protocolStatus').textContent=d.status;
      requestAnimationFrame(refreshProtocol);
    }
    refreshProtocol();
  }

  let lastEra=0;
  function refresh(){
    const era=Number(document.body.dataset.era||1);
    let finalTarget=1,current=0;
    try{
      const dirs=E.directivesFor(state);finalTarget=dirs[dirs.length-1].target||1;current=E.sustainedAverage(state,30)||E.throughput(state)||0;
    }catch(_){ }
    const ratio=Math.max(0,current/finalTarget);
    const levelSum=state?.cycle?.levels?Object.values(state.cycle.levels).reduce((a,b)=>a+b,0):0;
    const growth=ratio>=.72||levelSum>=28?3:ratio>=.38||levelSum>=16?2:ratio>=.12||levelSum>=7?1:0;
    scene.dataset.growth=String(growth);
    if(qaEra)document.body.dataset.qaOverflow=String(Math.max(0,document.documentElement.scrollWidth-window.innerWidth));
    if(era!==lastEra){
      lastEra=era;
      const cfg=identities[era]||identities[1];
      document.querySelectorAll('.machine[data-id]').forEach(el=>{
        const data=cfg[el.dataset.id];if(!data)return;
        const icon=el.querySelector('.machine-icon'),name=el.querySelector('b'),sub=el.querySelector('small');
        if(icon)icon.textContent=data[0];if(name)name.textContent=data[1];if(sub)sub.textContent=data[2];
      });
      scene.classList.remove('era-arrive');void scene.offsetWidth;scene.classList.add('era-arrive');
    }
    requestAnimationFrame(refresh);
  }
  refresh();
})();
