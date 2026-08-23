const header=document.querySelector('.site-header');
const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.nav-links');
const onScroll=()=>header?.classList.toggle('scrolled',window.scrollY>30); onScroll(); addEventListener('scroll',onScroll);
toggle?.addEventListener('click',()=>nav.classList.toggle('open'));
document.querySelectorAll('.nav-links a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));

// Envío AJAX compartido por todos los formularios de contacto.
// Evita la pantalla de CAPTCHA de FormSubmit y redirige a la página de gracias.
document.querySelectorAll('form.contact-form').forEach(form=>{
  form.addEventListener('submit',async event=>{
    event.preventDefault();

    const button=form.querySelector('button[type="submit"]');
    const status=form.querySelector('.form-status');
    const originalLabel=button?.textContent;

    if(button){
      button.disabled=true;
      button.textContent='Enviando…';
    }
    if(status) status.textContent='Enviando tus datos de forma segura…';

    try{
      const response=await fetch('https://formsubmit.co/ajax/parcelasconrio@gmail.com',{
        method:'POST',
        headers:{Accept:'application/json'},
        body:new FormData(form)
      });

      if(!response.ok) throw new Error('No fue posible completar el envío');
      location.href='https://terrazasdelfraile.cl/gracias';
    }catch(error){
      if(status) status.textContent='No pudimos enviar tu consulta. Inténtalo nuevamente.';
      if(button){
        button.disabled=false;
        button.textContent=originalLabel||'Enviar consulta';
      }
    }
  });
});

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

// Simulador de credito directo: pie y cuotas sin interes.
(()=>{
  const root=document.querySelector('[data-credit-simulator]');
  if(!root) return;

  const form=root.querySelector('[data-simulator-form]');
  const amountInput=root.querySelector('[data-sim-amount]');
  const monthlyOutput=root.querySelector('[data-result-monthly]');
  const planOutput=root.querySelector('[data-result-plan]');
  const downOutput=root.querySelector('[data-result-down]');
  const balanceOutput=root.querySelector('[data-result-balance]');
  const summaryInput=root.querySelector('[data-simulation-summary]');
  const whatsapp=root.querySelector('[data-visit-whatsapp]');
  if(!form||!amountInput||!monthlyOutput||!planOutput||!downOutput||!balanceOutput) return;

  const numberFormat=new Intl.NumberFormat('es-CL',{maximumFractionDigits:0});
  const currencyFormat=new Intl.NumberFormat('es-CL',{
    style:'currency',
    currency:'CLP',
    maximumFractionDigits:0
  });
  const parseAmount=value=>Number(String(value).replace(/\D/g,''))||0;
  const formatCurrency=value=>currencyFormat.format(Math.round(value)).replace('CLP','$').replace(/\s/g,'');

  const setUnavailable=()=>{
    amountInput.setAttribute('aria-invalid','true');
    monthlyOutput.textContent='—';
    planOutput.textContent='Ingresa un monto desde $1.000.000';
    downOutput.textContent='—';
    balanceOutput.textContent='—';
    if(summaryInput) summaryInput.value='Simulacion pendiente: monto no valido';
    if(whatsapp) whatsapp.setAttribute('aria-disabled','true');
  };

  const calculate=()=>{
    const amount=parseAmount(amountInput.value);
    const downPercent=Number(form.querySelector('input[name="sim-pie"]:checked')?.value||30);
    const installments=Number(form.querySelector('input[name="sim-cuotas"]:checked')?.value||18);
    if(amount<1000000){
      setUnavailable();
      return;
    }

    amountInput.removeAttribute('aria-invalid');
    const downPayment=Math.round(amount*downPercent/100);
    const balance=amount-downPayment;
    const monthly=Math.round(balance/installments);
    const formattedAmount=formatCurrency(amount);
    const formattedDown=formatCurrency(downPayment);
    const formattedBalance=formatCurrency(balance);
    const formattedMonthly=formatCurrency(monthly);

    monthlyOutput.textContent=formattedMonthly;
    planOutput.textContent=`${installments} cuotas · ${downPercent}% de pie`;
    downOutput.textContent=formattedDown;
    balanceOutput.textContent=formattedBalance;

    const summary=`Monto: ${formattedAmount}; Pie: ${downPercent}% (${formattedDown}); Cuotas: ${installments}; Saldo: ${formattedBalance}; Cuota estimada: ${formattedMonthly}`;
    if(summaryInput) summaryInput.value=summary;
    if(whatsapp){
      const message=`Hola, quiero agendar una visita a Terrazas del Fraile. Simulé un monto de ${formattedAmount}, con ${downPercent}% de pie y ${installments} cuotas. La cuota estimada es ${formattedMonthly}.`;
      whatsapp.href=`https://wa.me/56978893044?text=${encodeURIComponent(message)}`;
      whatsapp.removeAttribute('aria-disabled');
    }
  };

  amountInput.addEventListener('input',()=>{
    const amount=parseAmount(amountInput.value);
    amountInput.value=amount?numberFormat.format(amount):'';
    calculate();
  });
  form.addEventListener('change',calculate);
  form.addEventListener('submit',event=>{
    event.preventDefault();
    calculate();
  });
  calculate();
})();
