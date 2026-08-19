const header=document.querySelector('.site-header');
const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.nav-links');
const onScroll=()=>header?.classList.toggle('scrolled',window.scrollY>30); onScroll(); addEventListener('scroll',onScroll);
toggle?.addEventListener('click',()=>nav.classList.toggle('open'));
document.querySelectorAll('.nav-links a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));

// Hero de cuatro estaciones — carga progresiva y crossfade.
(()=>{
  const hero=document.querySelector('[data-seasonal-hero]');
  if(!hero) return;
  const slots=[...hero.querySelectorAll('.season-video')];
  if(slots.length<2) return;
  const seasons=['primavera','verano','otono','invierno'];
  const mobile=matchMedia('(max-width: 720px)').matches;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const kind=mobile?'mobile':'desktop';
  const src=s=>`assets/video/hero/${kind}/${s}.mp4`;
  const poster=s=>`assets/img/hero/posters/${kind}/${s}.webp`;
  let index=0, active=0, transitioning=false;

  const configure=(video,season,preload='metadata')=>{
    video.dataset.season=season;
    video.poster=poster(season);
    if(video.getAttribute('src')!==src(season)){
      video.src=src(season);
      video.preload=preload;
      video.load();
    }
  };

  configure(slots[0],seasons[0],'auto');
  slots[0].classList.add('is-active');
  slots[0].play().catch(()=>{});

  if(reduced) return;

  const prepareNext=()=>{
    const nextIndex=(index+1)%seasons.length;
    const hidden=slots[1-active];
    configure(hidden,seasons[nextIndex],'auto');
  };

  const transition=()=>{
    if(transitioning) return;
    transitioning=true;
    const current=slots[active];
    const nextSlot=1-active;
    const next=slots[nextSlot];
    const nextIndex=(index+1)%seasons.length;
    configure(next,seasons[nextIndex],'auto');
    next.currentTime=0;
    next.play().then(()=>{
      next.classList.add('is-active');
      current.classList.remove('is-active');
      setTimeout(()=>{
        current.pause();
        index=nextIndex;
        active=nextSlot;
        transitioning=false;
        prepareNext();
      },900);
    }).catch(()=>{
      index=nextIndex;
      active=nextSlot;
      next.classList.add('is-active');
      current.classList.remove('is-active');
      transitioning=false;
    });
  };

  slots.forEach(v=>v.addEventListener('timeupdate',()=>{
    if(v!==slots[active]||!isFinite(v.duration)||transitioning) return;
    if(v.duration-v.currentTime<.9) transition();
  }));
  slots.forEach(v=>v.addEventListener('ended',()=>{ if(v===slots[active]) transition(); }));
  slots[0].addEventListener('playing',prepareNext,{once:true});
})();
