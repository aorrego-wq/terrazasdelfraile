const header=document.querySelector('.site-header');
const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.nav-links');
const onScroll=()=>header?.classList.toggle('scrolled',window.scrollY>30); onScroll(); addEventListener('scroll',onScroll);
toggle?.addEventListener('click',()=>nav.classList.toggle('open'));
document.querySelectorAll('.nav-links a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
document.querySelectorAll('form[data-static-form]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();const s=form.querySelector('.form-status');s.textContent='Gracias. Tu consulta quedó preparada para envío. Conectaremos el formulario al correo definitivo.';form.reset();}));
