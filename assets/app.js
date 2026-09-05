(async function(){
  const host=document.getElementById('siteContent');
  const loader=document.getElementById('loader');
  const nav=document.getElementById('nav');
  const progress=document.getElementById('progress');
  const menuBtn=document.getElementById('menuBtn');
  const navLinks=document.getElementById('navLinks');
  const glow=document.getElementById('cursorGlow');

  // Shared reveal observer. Hero content is shown immediately; below-the-fold
  // content keeps the scroll reveal behavior.
  const revealIO=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('in');
        revealIO.unobserve(e.target);
      }
    });
  },{threshold:.12,rootMargin:'0px 0px -50px'});

  function observeReveals(root=document){
    root.querySelectorAll('.reveal,.reveal-left').forEach(el=>{
      if(!el.classList.contains('in')) revealIO.observe(el);
    });
  }

  function bindTilt(root=document){
    root.querySelectorAll('.service,.why-card,.tool,.tool-live-card').forEach(card=>{
      if(card.dataset.tiltBound) return;
      card.dataset.tiltBound='1';
      card.addEventListener('pointermove',e=>{
        if(!matchMedia('(pointer:fine)').matches) return;
        const r=card.getBoundingClientRect();
        const x=(e.clientX-r.left)/r.width-.5;
        const y=(e.clientY-r.top)/r.height-.5;
        card.style.transform=`translateY(-5px) rotateX(${-y*2}deg) rotateY(${x*2}deg)`;
      });
      card.addEventListener('pointerleave',()=>card.style.transform='');
    });
  }

  function initCounters(root=document){
    const counters=root.querySelectorAll('.counter:not([data-counter-bound])');
    if(!counters.length) return;
    const counterIO=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(!e.isIntersecting) return;
        const el=e.target;
        const target=+el.dataset.target;
        const start=performance.now();
        const dur=1100;
        const tick=now=>{
          const p=Math.min((now-start)/dur,1);
          const v=Math.floor(target*(1-Math.pow(1-p,3)));
          el.textContent=v;
          if(p<1) requestAnimationFrame(tick); else el.textContent=target;
        };
        requestAnimationFrame(tick);
        counterIO.unobserve(el);
      });
    },{threshold:.4});
    counters.forEach(c=>{c.dataset.counterBound='1';counterIO.observe(c)});
  }

  function initSlider(){
    const proofTrack=document.getElementById('proofTrack');
    const proofSlider=document.getElementById('proofSlider');
    const prev=document.getElementById('prevSlide');
    const next=document.getElementById('nextSlide');
    const dots=[...document.querySelectorAll('.slide-dot')];
    if(!proofTrack||!proofSlider||!prev||!next||!dots.length||proofSlider.dataset.bound) return;
    proofSlider.dataset.bound='1';
    let slide=0,timer;
    function showSlide(i){
      slide=(i+dots.length)%dots.length;
      proofTrack.style.transform=`translateX(-${slide*100}%)`;
      dots.forEach((d,n)=>d.classList.toggle('active',n===slide));
    }
    function restart(){clearInterval(timer);timer=setInterval(()=>showSlide(slide+1),6500)}
    prev.onclick=()=>{showSlide(slide-1);restart()};
    next.onclick=()=>{showSlide(slide+1);restart()};
    dots.forEach((d,i)=>d.onclick=()=>{showSlide(i);restart()});
    restart();
    proofSlider.addEventListener('mouseenter',()=>clearInterval(timer));
    proofSlider.addEventListener('mouseleave',restart);
  }

  function initTools(){
    const grid=document.getElementById('toolsLiveGrid');
    if(!grid||grid.dataset.liveBound||window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    grid.dataset.liveBound='1';
    const cards=[...grid.querySelectorAll('.tool-live-card')];
    if(!cards.length) return;
    let i=0,timer;
    function activate(n){cards.forEach((c,idx)=>c.classList.toggle('is-live',idx===n))}
    function start(){clearInterval(timer);timer=setInterval(()=>{i=(i+1)%cards.length;activate(i)},1500)}
    activate(0);start();
    grid.addEventListener('mouseenter',()=>{clearInterval(timer);cards.forEach(c=>c.classList.remove('is-live'))});
    grid.addEventListener('mouseleave',()=>{i=0;activate(i);start()});
  }

  function initBackTop(){
    const backTop=document.getElementById('backTop');
    if(!backTop||backTop.dataset.bound) return;
    backTop.dataset.bound='1';
    backTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  }

  function updateScrollUI(){
    const y=window.scrollY;
    const max=document.documentElement.scrollHeight-window.innerHeight;
    if(progress) progress.style.width=(max?y/max*100:0)+'%';
    if(nav) nav.classList.toggle('scrolled',y>30);
    const backTop=document.getElementById('backTop');
    if(backTop) backTop.classList.toggle('show',y>700);
  }

  window.addEventListener('scroll',updateScrollUI,{passive:true});
  updateScrollUI();
  if(menuBtn&&navLinks){
    menuBtn.addEventListener('click',()=>navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>navLinks.classList.remove('open')));
  }
  if(glow&&matchMedia('(pointer:fine)').matches){
    window.addEventListener('pointermove',e=>{glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px'});
  }else if(glow){glow.style.display='none'}

  function loadHDHero(){
    const heroFrame=document.querySelector('.hero-frame');
    const heroImg=heroFrame?.querySelector('img');
    if(!heroFrame||!heroImg) return;
    const chunkUrls=Array.from({length:7},(_,i)=>`assets/hero-hd/chunk-${String(i+1).padStart(2,'0')}.txt?v=1`);
    Promise.all(chunkUrls.map(async u=>{
      const r=await fetch(u,{cache:'force-cache'});
      if(!r.ok) throw new Error('Failed HD hero chunk '+u);
      return (await r.text()).trim();
    })).then(chunks=>{
      const cleanBase64=chunks.join('').replace(/=+$/,'');
      const hd='data:image/webp;base64,'+cleanBase64;
      const preload=new Image();
      preload.onload=()=>{heroImg.src=hd;heroFrame.classList.add('hero-hd-ready')};
      preload.src=hd;
    }).catch(err=>console.warn('HD hero fallback active',err));
  }

  try{
    // Critical path: only fetch the first fragment before revealing the page.
    const firstResponse=await fetch('fragments/part1.html',{cache:'force-cache'});
    if(!firstResponse.ok) throw new Error('Failed to load fragments/part1.html');
    let first=await firstResponse.text();
    first=first.replace('<img src="assets/hero.webp"','<img fetchpriority="high" decoding="async" src="assets/hero.webp"');
    host.innerHTML=first;

    // Make the hero visible immediately instead of waiting for every section.
    host.querySelectorAll('.hero .reveal,.hero .reveal-left').forEach(el=>el.classList.add('in'));
    observeReveals(host);
    bindTilt(host);
    loadHDHero();
    requestAnimationFrame(()=>loader?.classList.add('done'));

    // Non-critical sections load in the background after first paint.
    const [r2,r3]=await Promise.all([
      fetch('fragments/part2.html',{cache:'force-cache'}),
      fetch('fragments/part3.html',{cache:'force-cache'})
    ]);
    if(!r2.ok||!r3.ok) throw new Error('Failed to load deferred portfolio sections');
    let part2=await r2.text();
    let part3=await r3.text();

    // Proof images are below the fold; lazy-load them.
    part2=part2.replace(/<img /g,'<img loading="lazy" decoding="async" ');
    // Tool logos use the local sprite from hotfix.css, so suppress unnecessary
    // third-party logo requests entirely.
    part3=part3.replace(/<img\b[^>]*>/gi,'');

    const deferred=document.createElement('div');
    deferred.id='deferredPortfolio';
    deferred.innerHTML=part2+part3;
    host.appendChild(deferred);

    observeReveals(deferred);
    bindTilt(deferred);
    initCounters(deferred);
    initSlider();
    initTools();
    initBackTop();
    updateScrollUI();

    // Respect a deep link if the visitor arrived on a deferred section.
    if(location.hash&&document.querySelector(location.hash)){
      requestAnimationFrame(()=>document.querySelector(location.hash)?.scrollIntoView());
    }
  }catch(err){
    console.error(err);
    loader?.classList.add('done');
    if(!host.innerHTML.trim()){
      host.innerHTML='<section style="min-height:60vh;display:grid;place-items:center;padding:80px 24px;background:#071019;color:#f4efe5"><div><h1 style="font-family:Manrope,sans-serif">Portfolio loading issue</h1><p>Please refresh the page.</p></div></section>';
    }
  }
})();