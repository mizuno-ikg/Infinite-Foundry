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

  const identities={
    1:{source:['⛏','SOURCE','Input'],process:['♨','PROCESS','Conversion'],transfer:['⇢','TRANSFER','Logistics'],assembly:['⚙','ASSEMBLY','Integration'],power:['ϟ','POWER','Energy grid']},
    2:{source:['▣','FEED ARRAY','Auto intake'],process:['⌬','ROBOT CELLS','Continuous conversion'],transfer:['⇶','SMART BELTS','Synced logistics'],assembly:['⚙','AUTO ASSEMBLY','Machine integration'],power:['ϟ','GRID CORE','Load routing']},
    3:{source:['▥','RESOURCE HUB','District intake'],process:['▤','REFINERY BLOCK','City processing'],transfer:['⇉','FREIGHT SPINE','Metro logistics'],assembly:['▦','MEGAPLANT','Mass integration'],power:['ϟ','CITY GRID','Urban energy']},
    4:{source:['◉','CRUST MINES','Planetary intake'],process:['◌','MANTLE WORKS','Deep conversion'],transfer:['↥','ORBITAL LIFT','Surface-to-orbit'],assembly:['◇','ORBITAL YARD','Planet-scale integration'],power:['ϟ','PLANET GRID','Global energy']},
    5:{source:['✦','STELLAR FEED','Matter capture'],process:['☀','FUSION FORGE','Star processing'],transfer:['⌒','DYSON RELAY','Collector logistics'],assembly:['✧','STAR FOUNDRY','Stellar integration'],power:['ϟ','SOLAR CORE','Captive-star energy']},
    6:{source:['λ','FIELD SOURCE','Law substrate'],process:['∫','CONSTANT PRESS','Rule transformation'],transfer:['⇌','CAUSAL LINK','State transfer'],assembly:['Ω','LAW ENGINE','Reality integration'],power:['ϟ','VACUUM GRID','Field energy']},
    7:{source:['✺','PRIME MATTER','Genesis feed'],process:['◎','COSMIC FURNACE','Universe formation'],transfer:['∞','SPACETIME WEAVE','Cosmic transport'],assembly:['◈','GENESIS ARRAY','Universe integration'],power:['ϟ','IGNITION CORE','Creation energy']}
  };
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
