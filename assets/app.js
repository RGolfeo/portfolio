(async function(){
  const host=document.getElementById('siteContent');
  try{
    const urls=['fragments/part1.html','fragments/part2.html','fragments/part3.html'];
    const parts=await Promise.all(urls.map(async u=>{const r=await fetch(u);if(!r.ok)throw new Error('Failed to load '+u);return r.text();}));
    host.innerHTML=parts.join('');

    // Progressive HD hero loader. The small local hero remains as a fast fallback,
    // then the sharper 800px portrait is reconstructed from local GitHub Pages chunks.
    const heroFrame=document.querySelector('.hero-frame');
    const heroImg=heroFrame?.querySelector('img');
    if(heroFrame&&heroImg){
      const chunkUrls=Array.from({length:7},(_,i)=>`assets/hero-hd/chunk-${String(i+1).padStart(2,'0')}.txt?v=1`);
      Promise.all(chunkUrls.map(async u=>{
        const r=await fetch(u,{cache:'force-cache'});
        if(!r.ok)throw new Error('Failed HD hero chunk '+u);
        return (await r.text()).trim();
      })).then(chunks=>{
        const cleanBase64=chunks.join('').replace(/=+$/,'');
        const hd='data:image/webp;base64,'+cleanBase64;
        const preload=new Image();
        preload.onload=()=>{
          heroImg.src=hd;
          heroFrame.classList.add('hero-hd-ready');
        };
        preload.src=hd;
      }).catch(err=>console.warn('HD hero fallback active',err));
    }
  }catch(err){
    console.error(err);
    host.innerHTML='<section style="min-height:60vh;display:grid;place-items:center;padding:80px 24px;background:#071019;color:#f4efe5"><div><h1 style="font-family:Manrope,sans-serif">Portfolio loading issue</h1><p>Please refresh the page.</p></div></section>';
  }

const loader=document.getElementById('loader');
const nav=document.getElementById('nav'),progress=document.getElementById('progress'),backTop=document.getElementById('backTop');
function onScroll(){
  const y=window.scrollY, max=document.documentElement.scrollHeight-window.innerHeight;
  progress.style.width=(max?y/max*100:0)+'%';
  nav.classList.toggle('scrolled',y>30);
  backTop.classList.toggle('show',y>700);
}
window.addEventListener('scroll',onScroll,{passive:true}); onScroll();
backTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));

const menuBtn=document.getElementById('menuBtn'),navLinks=document.getElementById('navLinks');
menuBtn.addEventListener('click',()=>navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>navLinks.classList.remove('open')));

const io=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})
},{threshold:.12,rootMargin:'0px 0px -50px'});
document.querySelectorAll('.reveal,.reveal-left').forEach(el=>io.observe(el));

const counters=document.querySelectorAll('.counter');
const counterIO=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(!e.isIntersecting)return;
    const el=e.target,target=+el.dataset.target,start=performance.now(),dur=1100;
    const tick=now=>{const p=Math.min((now-start)/dur,1),v=Math.floor(target*(1-Math.pow(1-p,3)));el.textContent=v;if(p<1)requestAnimationFrame(tick);else el.textContent=target}
    requestAnimationFrame(tick);counterIO.unobserve(el);
  })
},{threshold:.4});
counters.forEach(c=>counterIO.observe(c));

const proofTrack=document.getElementById('proofTrack'), dots=[...document.querySelectorAll('.slide-dot')];
let slide=0, timer;
function showSlide(i){
  slide=(i+dots.length)%dots.length;
  proofTrack.style.transform=`translateX(-${slide*100}%)`;
  dots.forEach((d,n)=>d.classList.toggle('active',n===slide));
}
document.getElementById('prevSlide').onclick=()=>{showSlide(slide-1);restart()};
document.getElementById('nextSlide').onclick=()=>{showSlide(slide+1);restart()};
dots.forEach((d,i)=>d.onclick=()=>{showSlide(i);restart()});
function restart(){clearInterval(timer);timer=setInterval(()=>showSlide(slide+1),6500)}
restart();
document.getElementById('proofSlider').addEventListener('mouseenter',()=>clearInterval(timer));
document.getElementById('proofSlider').addEventListener('mouseleave',restart);

const glow=document.getElementById('cursorGlow');
if(matchMedia('(pointer:fine)').matches){
  window.addEventListener('pointermove',e=>{glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px'});
}else glow.style.display='none';

document.querySelectorAll('.service,.why-card,.tool').forEach(card=>{
  card.addEventListener('pointermove',e=>{
    const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    if(matchMedia('(pointer:fine)').matches) card.style.transform=`translateY(-5px) rotateX(${-y*2}deg) rotateY(${x*2}deg)`;
  });
  card.addEventListener('pointerleave',()=>card.style.transform='');
});

(function(){
  const grid=document.getElementById('toolsLiveGrid');
  if(!grid || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cards=[...grid.querySelectorAll('.tool-live-card')];
  let i=0, timer;
  function activate(n){cards.forEach((c,idx)=>c.classList.toggle('is-live',idx===n));}
  function start(){clearInterval(timer);timer=setInterval(()=>{i=(i+1)%cards.length;activate(i);},1500);}
  activate(0); start();
  grid.addEventListener('mouseenter',()=>{clearInterval(timer);cards.forEach(c=>c.classList.remove('is-live'));});
  grid.addEventListener('mouseleave',()=>{i=0;activate(i);start();});
})();

setTimeout(()=>loader.classList.add('done'),520);
})();
