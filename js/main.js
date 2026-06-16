/* PetPrime — main.js */

/* ── Header scroll ── */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 20);
});

/* ── Hamburger ── */
const hamburger = document.querySelector('.hamburger');
const mobileNav = document.querySelector('.mobile-nav');

hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  mobileNav.classList.toggle('open');
});

mobileNav?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    hamburger.classList.remove('active');
    mobileNav.classList.remove('open');
  });
});

/* ── Scroll fade-up animations ── */
const fadeEls = document.querySelectorAll('.fade-up');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
fadeEls.forEach(el => observer.observe(el));

/* ── FAQ ── */
document.querySelectorAll('.faq-question').forEach(q => {
  q.addEventListener('click', () => {
    const item = q.parentElement;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

/* ── Formulário de agendamento ── */
const form = document.getElementById('form-agendamento');

function showError(input, msg) {
  input.classList.add('error');
  const err = input.parentElement.querySelector('.form-error');
  if (err) { err.textContent = msg; err.classList.add('show'); }
}
function clearError(input) {
  input.classList.remove('error');
  const err = input.parentElement.querySelector('.form-error');
  if (err) err.classList.remove('show');
}

function validateForm() {
  let valid = true;
  const fields = form.querySelectorAll('input[required], select[required]');
  fields.forEach(f => {
    clearError(f);
    if (!f.value.trim()) {
      showError(f, 'Este campo é obrigatório.');
      valid = false;
    } else if (f.type === 'tel' && !/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(f.value.trim())) {
      showError(f, 'Telefone inválido. Ex: (34) 99999-9999');
      valid = false;
    }
  });
  return valid;
}

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const nome      = form.nome.value.trim();
  const tel       = form.telefone.value.trim();
  const pet       = form.pet.value.trim();
  const servico   = form.servico.value;
  const data      = form.data.value;
  const hora      = form.hora.value;
  const taxiPet   = form.querySelector('#taxi-pet')?.checked;
  const obs       = form.observacoes?.value.trim();

  let msg = `🐾 *Agendamento PetPrime*\n\n`;
  msg += `*Nome:* ${nome}\n`;
  msg += `*Telefone:* ${tel}\n`;
  msg += `*Pet:* ${pet}\n`;
  msg += `*Serviço:* ${servico}\n`;
  msg += `*Data:* ${data}\n`;
  msg += `*Horário:* ${hora}\n`;
  if (taxiPet) msg += `*Táxi Pet:* ✅ Sim\n`;
  if (obs) msg += `*Observações:* ${obs}\n`;

  const encoded = encodeURIComponent(msg);
  window.open(`https://wa.me/5534998111439?text=${encoded}`, '_blank');
});

/* ── LGPD ── */
const lgpd = document.getElementById('lgpd-banner');
if (lgpd) {
  if (!localStorage.getItem('petprime_lgpd')) {
    setTimeout(() => lgpd.classList.add('show'), 1000);
  }
  document.getElementById('lgpd-accept')?.addEventListener('click', () => {
    localStorage.setItem('petprime_lgpd', '1');
    lgpd.classList.remove('show');
  });
  document.getElementById('lgpd-decline')?.addEventListener('click', () => {
    lgpd.classList.remove('show');
  });
}

/* ── Lazy loading ── */
if ('loading' in HTMLImageElement.prototype) {
  document.querySelectorAll('img[data-src]').forEach(img => {
    img.src = img.dataset.src;
  });
} else {
  const lazyObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.src = e.target.dataset.src;
        lazyObs.unobserve(e.target);
      }
    });
  });
  document.querySelectorAll('img[data-src]').forEach(img => lazyObs.observe(img));
}

/* ── Smooth scroll for anchor links ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
