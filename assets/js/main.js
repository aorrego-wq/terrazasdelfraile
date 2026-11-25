const header=document.querySelector('.site-header');
const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.nav-links');
const dropdown=document.querySelector('[data-nav-dropdown]');
const dropdownToggle=dropdown?.querySelector('.nav-dropdown-toggle');
const projectLink=dropdown?.querySelector('.nav-dropdown-link');
const firstNavLink=nav?.querySelector('a[href="/"]');
const mobileNavigation=matchMedia('(max-width: 1100px)');
const track=(event,details={})=>{
  window.dataLayer=window.dataLayer||[];
  window.dataLayer.push({event,...details});
};
const onScroll=()=>header?.classList.toggle('scrolled',window.scrollY>30);
const setDropdown=open=>{
  dropdown?.classList.toggle('is-open',open);
  dropdownToggle?.setAttribute('aria-expanded',String(open));
};
const closeNavigation=()=>{
  nav?.classList.remove('open');
  toggle?.setAttribute('aria-expanded','false');
  setDropdown(false);
};

onScroll();
addEventListener('scroll',onScroll,{passive:true});

toggle?.addEventListener('click',()=>{
  const open=!nav?.classList.contains('open');
  nav?.classList.toggle('open',open);
  toggle.setAttribute('aria-expanded',String(open));
  if(!open) setDropdown(false);
});

dropdownToggle?.addEventListener('click',event=>{
  event.stopPropagation();
  setDropdown(!dropdown?.classList.contains('is-open'));
});

projectLink?.addEventListener('click',event=>{
  if(mobileNavigation.matches&&!dropdown?.classList.contains('is-open')){
    event.preventDefault();
    setDropdown(true);
  }
});

document.querySelectorAll('.nav-links a').forEach(link=>link.addEventListener('click',event=>{
  if(event.defaultPrevented) return;
  closeNavigation();
}));

document.addEventListener('click',event=>{
  if(dropdown&&!dropdown.contains(event.target)) setDropdown(false);
});

document.addEventListener('keydown',event=>{
  if(event.key!=='Escape') return;
  closeNavigation();
  (mobileNavigation.matches?toggle:firstNavLink)?.focus();
});

const currentPath=location.pathname.replace(/\.html$/,'').replace(/\/$/,'')||'/';
document.querySelectorAll('[data-nav-route]').forEach(link=>{
  if(link.dataset.navRoute===currentPath) link.classList.add('active');
});
if(['/el-proyecto','/marina-lago-frio','/centro-de-ski','/bosque-nativo'].includes(currentPath)){
  projectLink?.classList.add('active');
}

document.addEventListener('click',event=>{
  const link=event.target.closest('a');
  if(!link) return;
  const rawHref=link.getAttribute('href')||'';
  const automaticLabel=rawHref.includes('/masterplan')?'masterplan':rawHref.includes('/simulador-credito-directo')?'credito_directo':rawHref.includes('wa.me')?'whatsapp':rawHref.includes('maps.app.goo.gl')?'mapa_ubicacion':null;
  const label=link.dataset.track||automaticLabel;
  const inPrimaryNav=Boolean(link.closest('#site-navigation'));
  if(label) track('cta_click',{cta:label,href:link.href});
  if(inPrimaryNav) track('navigation_click',{label:link.textContent.trim()||link.getAttribute('aria-label'),href:link.href});
});

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
    track('form_submit',{form_subject:form.querySelector('[name="_subject"]')?.value||'Consulta Terrazas del Fraile'});

    // El consentimiento de promociones es opcional: si no se marca, se informa "no".
    const formData=new FormData(form);
    if(form.querySelector('[name="consentimiento_promociones"]')&&!formData.has('consentimiento_promociones')) formData.set('consentimiento_promociones','no');

    try{
      const response=await fetch('https://formsubmit.co/ajax/parcelasconrio@gmail.com',{
        method:'POST',
        headers:{Accept:'application/json'},
        body:formData
      });

      if(!response.ok) throw new Error('No fue posible completar el envío');
      track('form_submit_success',{form_subject:form.querySelector('[name="_subject"]')?.value||'Consulta Terrazas del Fraile'});
      setTimeout(()=>{location.href='https://terrazasdelfraile.cl/gracias'},600);
    }catch(error){
      track('form_submit_error',{form_subject:form.querySelector('[name="_subject"]')?.value||'Consulta Terrazas del Fraile'});
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
  const monthlyOutput=root.querySelector('[data-result-monthly]');
  const planOutput=root.querySelector('[data-result-plan]');
  const downOutput=root.querySelector('[data-result-down]');
  const balanceOutput=root.querySelector('[data-result-balance]');
  const summaryInput=root.querySelector('[data-simulation-summary]');
  const whatsapp=root.querySelector('[data-visit-whatsapp]');
  if(!form||!monthlyOutput||!planOutput||!downOutput||!balanceOutput) return;

  const currencyFormat=new Intl.NumberFormat('es-CL',{
    style:'currency',
    currency:'CLP',
    maximumFractionDigits:0
  });
  const formatCurrency=value=>currencyFormat.format(Math.round(value)).replace('CLP','$').replace(/\s/g,'');
  const finalPrice=32900000;

  const calculate=()=>{
    const selected=form.querySelector('input[name="sim-plan"]:checked');
    if(!selected) return;
    const downPercent=Number(selected.value);
    const installments=Number(selected.dataset.installments);
    const downPayment=Number(selected.dataset.down);
    const balance=Number(selected.dataset.balance);
    const monthly=Number(selected.dataset.monthly);
    const formattedAmount=formatCurrency(finalPrice);
    const formattedDown=formatCurrency(downPayment);
    const formattedBalance=formatCurrency(balance);
    const formattedMonthly=formatCurrency(monthly);

    monthlyOutput.textContent=formattedMonthly;
    planOutput.textContent=`${installments} cuotas · ${downPercent}% de pie`;
    downOutput.textContent=formattedDown;
    balanceOutput.textContent=formattedBalance;

    const summary=`Precio normal: $35.900.000; Descuento de lanzamiento: $3.000.000; Precio final: ${formattedAmount}; Pie: ${downPercent}% (${formattedDown}); Saldo: ${formattedBalance}; Cuotas: ${installments}; Cuota estimada: ${formattedMonthly}`;
    if(summaryInput) summaryInput.value=summary;
    if(whatsapp){
      const message=`Hola, quiero agendar una visita a Terrazas del Fraile. Me interesa la modalidad de ${downPercent}% de pie (${formattedDown}) y ${installments} cuotas aproximadas de ${formattedMonthly}, para el precio final de ${formattedAmount}.`;
      whatsapp.href=`https://wa.me/56978893044?text=${encodeURIComponent(message)}`;
    }
  };

  form.addEventListener('change',calculate);
  calculate();
})();

// ===== Píxel de Meta: eventos para remarketing (mismo píxel que parcelasconrio.cl) =====
(()=>{
  const PROJ={content_name:'Terrazas del Fraile',content_ids:['terrazas-del-fraile'],content_type:'product',content_category:'Parcelas Aysén',proyecto:'terrazas-del-fraile',region:'Aysén',value:30900000,currency:'CLP'};
  const path=location.pathname.replace(/\.html$/,'').replace(/\/$/,'')||'/';
  const base=extra=>({...PROJ,pagina:path,...(extra||{})});
  const px=(ev,params,std,opts)=>{try{window.fbq&&window.fbq(std?'track':'trackCustom',ev,params||{},opts||{})}catch(e){}};
  const done={};
  const px1=(key,ev,params,std)=>{if(done[key])return;done[key]=1;px(ev,params,std)};
  window.tdfPixel=px;

  // Páginas
  const pages={'/el-proyecto':'VerProyecto','/masterplan':'VerMasterplan','/simulador-credito-directo':'VerSimulador','/contacto':'VerContacto','/marina-lago-frio':'VerMarina','/centro-de-ski':'VerCentroSki','/bosque-nativo':'VerBosqueNativo','/vida-outdoor':'VerVidaOutdoor','/pesca':'VerPesca','/coyhaique':'VerCoyhaique','/patagonia':'VerPatagonia','/english':'VerIngles','/gracias':'PaginaGracias'};
  if(path==='/'||['/el-proyecto','/masterplan','/simulador-credito-directo'].includes(path)) px('ViewContent',base(),true);
  if(pages[path]) px(pages[path],base());

  // Los eventos que ya se envían a dataLayer se replican en el píxel
  const dl=window.dataLayer=window.dataLayer||[];
  const push=dl.push.bind(dl);
  dl.push=(...items)=>{
    items.forEach(it=>{
      if(!it||typeof it!=='object') return;
      const p=base({cta:it.cta,href:it.href});
      if(it.event==='cta_click'){
        if(it.cta==='whatsapp'||/wa\.me/.test(it.href||'')){px('Contact',{...p,metodo:'whatsapp'},true);px('ClicWhatsApp',p);}
        else if(it.cta==='masterplan') px('VerMasterplan',p);
        else if(it.cta==='credito_directo') px('ClicSimulador',p);
        else if(it.cta==='mapa_ubicacion'){px('FindLocation',p,true);px('ComoLlegar',p);}
        else px('ClicCTA',p);
      }
      if(it.event==='form_submit') px('FormularioEnviado',base({asunto:it.form_subject}));
      if(it.event==='form_submit_success'){
        const eid='lead-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
        px('Lead',base({asunto:it.form_subject}),true,{eventID:eid});
        px('LeadTerrazas',base({asunto:it.form_subject}));
      }
      if(it.event==='form_submit_error') px('FormularioError',base());
    });
    return push(...items);
  };

  // Clics no cubiertos: correo, teléfono, brochure, redes
  document.addEventListener('click',e=>{
    const a=e.target.closest('a'); if(!a) return;
    const h=a.getAttribute('href')||'';
    if(/^mailto:/.test(h)){px('Contact',base({metodo:'correo'}),true);px('ClicCorreo',base());}
    else if(/^tel:/.test(h)){px('Contact',base({metodo:'telefono'}),true);px('ClicTelefono',base());}
    else if(/drive\.google|brochure/i.test(h)) px('DescargaBrochure',base());
    else if(/instagram\.com|facebook\.com/.test(h)) px('ClicRedSocial',base({red:/instagram/.test(h)?'instagram':'facebook'}));
  },true);

  // Simulador
  const sim=document.querySelector('[data-simulator-form]');
  if(sim) sim.addEventListener('change',()=>{
    const s=sim.querySelector('input[name="sim-plan"]:checked');
    px1('sim','CustomizeProduct',base(),true);
    px('SimuladorUsado',base({pie:s&&s.value,cuotas:s&&s.dataset.installments}));
  });
  const simWa=document.querySelector('[data-visit-whatsapp]');
  if(simWa) simWa.addEventListener('click',()=>px('SimulacionWhatsApp',base()));

  // Formulario iniciado (para recuperar abandonos)
  document.querySelectorAll('form.contact-form').forEach(f=>f.addEventListener('focusin',()=>px1('fi','FormularioIniciado',base())));

  // Secciones vistas
  if('IntersectionObserver' in window){
    [['.price-card','VerPrecios'],['[data-credit-simulator]','VerSimuladorSeccion'],['form.contact-form','VerFormulario'],['iframe[src*="masterplan"],iframe[src*="virtualplan"]','VerMasterplan']].forEach(([sel,ev])=>{
      const el=document.querySelector(sel); if(!el) return;
      const o=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){px1('s'+ev,ev,base());o.disconnect()}}),{threshold:.35});
      o.observe(el);
    });
  }

  // Scroll y tiempo activo
  addEventListener('scroll',()=>{
    const d=document.documentElement,pct=(scrollY+innerHeight)/d.scrollHeight*100;
    [25,50,75,90].forEach(m=>{if(pct>=m) px1('sc'+m,'Scroll'+m,base())});
  },{passive:true});
  let active=0;const t=setInterval(()=>{
    if(document.hidden) return; active+=5;
    if(active===30) px('Tiempo30s',base());
    if(active===90){px('Tiempo90s',base());px('VisitanteComprometido',base());}
    if(active===180){px('Tiempo3min',base());clearInterval(t);}
  },5000);

  // Videos con controles (no los del hero de estaciones)
  document.querySelectorAll('video').forEach(v=>{
    if(v.closest('[data-seasonal-hero]')||v.classList.contains('season-video')) return;
    const n=(v.currentSrc||v.getAttribute('src')||'video').split('/').pop();
    v.addEventListener('play',()=>px1('vp'+n,'VideoReproducido',base({video:n})));
    v.addEventListener('timeupdate',()=>{if(!v.duration)return;const r=v.currentTime/v.duration;if(r>=.5)px1('v50'+n,'Video50',base({video:n}));if(r>=.95)px1('v95'+n,'VideoCompleto',base({video:n}));});
  });
})();
