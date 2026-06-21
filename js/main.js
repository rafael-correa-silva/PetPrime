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

/* ── Formulário de agendamento (multi-etapas) ── */
const form = document.getElementById('form-agendamento');

if (form) {

  /* — Feriados nacionais fixos (MM-DD). Cobre os principais; datas móveis
     (Carnaval, Sexta-feira Santa, Corpus Christi) são recalculadas por ano. — */
  const FERIADOS_FIXOS = new Set([
    '01-01', // Confraternização Universal
    '04-21', // Tiradentes
    '05-01', // Dia do Trabalho
    '09-07', // Independência
    '10-12', // Nossa Sra. Aparecida
    '11-02', // Finados
    '11-15', // Proclamação da República
    '11-20', // Consciência Negra
    '12-25', // Natal
  ]);

  function calcularPascoa(ano) {
    // Algoritmo de Gauss para Domingo de Páscoa
    const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(ano, mes - 1, dia);
  }

  function feriadosMoveis(ano) {
    const pascoa = calcularPascoa(ano);
    const carnaval = new Date(pascoa); carnaval.setDate(pascoa.getDate() - 47);
    const sextaSanta = new Date(pascoa); sextaSanta.setDate(pascoa.getDate() - 2);
    const corpusChristi = new Date(pascoa); corpusChristi.setDate(pascoa.getDate() + 60);
    return [carnaval, sextaSanta, corpusChristi].map(d =>
      `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    );
  }

  function chaveData(date) {
    return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function ehFeriado(date) {
    const chave = chaveData(date);
    if (FERIADOS_FIXOS.has(chave)) return true;
    return feriadosMoveis(date.getFullYear()).includes(chave);
  }

  function parseDataLocal(valorISO) {
    const [y, m, d] = valorISO.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function statusDoDia(date) {
    const diaSemana = date.getDay(); // 0=domingo, 6=sábado
    if (ehFeriado(date)) return 'feriado';
    if (diaSemana === 0 || diaSemana === 6) return 'fechado';
    return 'normal';
  }

  const HORARIOS = {
    normal:  ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'],
    feriado: ['08:00','09:00','10:00','11:00'],
    fechado: [],
  };

  /* — Referências dos campos — */
  const inputData   = form.querySelector('#data');
  const selectHora  = form.querySelector('#hora');
  const dataHint    = form.querySelector('#data-hint');
  const inputTel    = form.querySelector('#telefone');
  const taxiCheck   = form.querySelector('#taxi-pet');
  const enderecoWrap= form.querySelector('#taxi-endereco-wrap');
  const inputEndereco = form.querySelector('#endereco');
  const obsField    = form.querySelector('#observacoes');
  const obsCount    = form.querySelector('#obs-count');
  const resumoCard  = form.querySelector('#resumo-card');

  /* — Limites de data: hoje até +60 dias — */
  const hoje = new Date();
  hoje.setHours(0,0,0,0);
  const dataMax = new Date(hoje);
  dataMax.setDate(dataMax.getDate() + 60);
  function isoDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  if (inputData) {
    inputData.min = isoDate(hoje);
    inputData.max = isoDate(dataMax);
  }

  /* — Atualiza horários disponíveis conforme a data escolhida — */
  function atualizarHorarios() {
    if (!inputData.value) {
      selectHora.innerHTML = '<option value="">Escolha a data primeiro</option>';
      selectHora.disabled = true;
      dataHint.textContent = '';
      inputData.classList.remove('valid', 'error');
      return;
    }

    const dataEscolhida = parseDataLocal(inputData.value);
    const status = statusDoDia(dataEscolhida);

    if (status === 'fechado') {
      selectHora.innerHTML = '<option value="">Fechado nesta data</option>';
      selectHora.disabled = true;
      dataHint.textContent = '⚠️ Não atendemos aos sábados e domingos. Escolha outro dia.';
      dataHint.style.color = '#E53935';
      inputData.classList.remove('valid');
      inputData.classList.add('error');
      return;
    }

    inputData.classList.remove('error');
    inputData.classList.add('valid');

    const horarios = HORARIOS[status];
    selectHora.innerHTML = '<option value="">Selecione...</option>' +
      horarios.map(h => `<option value="${h}">${h}</option>`).join('');
    selectHora.disabled = false;

    if (status === 'feriado') {
      dataHint.textContent = '🎉 Feriado — atendimento especial das 8h às 12h.';
      dataHint.style.color = 'var(--gold-dk)';
    } else {
      dataHint.textContent = '✅ Funcionamento normal, das 8h às 18h.';
      dataHint.style.color = '#2E7D32';
    }
  }
  inputData?.addEventListener('change', atualizarHorarios);

  /* — Máscara de telefone em tempo real — */
  function maskTelefone(value) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits.replace(/^(\d*)/, '($1');
    if (digits.length <= 7) return digits.replace(/^(\d{2})(\d*)/, '($1) $2');
    return digits.replace(/^(\d{2})(\d{4,5})(\d{0,4})/, (m, a, b, c) =>
      c ? `(${a}) ${b}-${c}` : `(${a}) ${b}`
    );
  }
  inputTel?.addEventListener('input', () => {
    inputTel.value = maskTelefone(inputTel.value);
  });

  /* — Contador de caracteres das observações — */
  obsField?.addEventListener('input', () => {
    obsCount.textContent = obsField.value.length;
  });

  /* — Campo de endereço condicional ao marcar Táxi Pet — */
  taxiCheck?.addEventListener('change', () => {
    enderecoWrap.hidden = !taxiCheck.checked;
    inputEndereco.required = taxiCheck.checked;
    if (!taxiCheck.checked) {
      inputEndereco.value = '';
      inputEndereco.classList.remove('valid', 'error');
    }
    salvarRascunho();
  });

  /* — Feedback visual de campo válido (check verde) em tempo real — */
  form.querySelectorAll('input, select').forEach(field => {
    if (field.type === 'checkbox') return;
    field.addEventListener('input', () => marcarValidacao(field));
    field.addEventListener('change', () => marcarValidacao(field));
  });
  function marcarValidacao(field) {
    const valido = field.checkValidity() && field.value.trim() !== '';
    field.classList.toggle('valid', valido);
    if (valido) field.classList.remove('error');
  }

  /* ===================== NAVEGAÇÃO ENTRE ETAPAS ===================== */
  const stages = Array.from(form.querySelectorAll('.form-stage'));
  const stepEls = Array.from(form.parentElement.querySelectorAll('.form-step'));
  const stepLines = Array.from(form.parentElement.querySelectorAll('.form-step-line'));

  function irParaEtapa(numero) {
    stages.forEach(s => s.classList.toggle('active', s.dataset.stage === String(numero)));
    stepEls.forEach(s => {
      const n = Number(s.dataset.step);
      s.classList.toggle('active', n === numero);
      s.classList.toggle('done', n < numero);
    });
    stepLines.forEach((line, i) => line.classList.toggle('done', (i + 1) < numero));
    if (numero === 4) montarResumo();
    form.closest('.form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function validarEtapa(stageEl) {
    let valido = true;
    const campos = stageEl.querySelectorAll('input[required], select[required]');
    campos.forEach(f => {
      clearError(f);
      if (!f.value.trim()) {
        showError(f, 'Este campo é obrigatório.');
        valido = false;
      } else if (f.id === 'telefone' && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(f.value.trim())) {
        showError(f, 'Telefone inválido. Ex: (34) 99999-9999');
        valido = false;
      } else if (f.id === 'data' && selectHora.disabled) {
        showError(f, 'Escolha uma data em que estamos abertos.');
        valido = false;
      } else if (f.id === 'hora' && !f.value) {
        valido = false;
      } else {
        marcarValidacao(f);
      }
    });
    return valido;
  }

  form.querySelectorAll('.form-next').forEach(btn => {
    btn.addEventListener('click', () => {
      const etapaAtual = btn.closest('.form-stage');
      if (!validarEtapa(etapaAtual)) return;
      salvarRascunho();
      irParaEtapa(Number(btn.dataset.next));
    });
  });

  form.querySelectorAll('.form-prev').forEach(btn => {
    btn.addEventListener('click', () => irParaEtapa(Number(btn.dataset.prev)));
  });

  /* ===================== RESUMO FINAL ===================== */
  const SERVICO_EMOJI = { 'Banho': '🛁', 'Tosa': '✂️', 'Banho + Tosa': '🐶' };

  function formatarDataBR(valorISO) {
    const d = parseDataLocal(valorISO);
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  }

  function montarResumo() {
    const nome = form.nome.value.trim();
    const tel = form.telefone.value.trim();
    const pet = form.pet.value.trim();
    const servico = form.servico.value;
    const data = form.data.value;
    const hora = form.hora.value;
    const taxi = taxiCheck.checked;
    const endereco = form.endereco.value.trim();
    const obs = form.observacoes.value.trim();

    let html = `
      <div class="resumo-row"><span class="resumo-label">Nome</span><span class="resumo-value">${escapeHTML(nome)}</span></div>
      <div class="resumo-row"><span class="resumo-label">WhatsApp</span><span class="resumo-value">${escapeHTML(tel)}</span></div>
      <div class="resumo-row"><span class="resumo-label">Pet</span><span class="resumo-value">${escapeHTML(pet)}</span></div>
      <button type="button" class="resumo-edit" data-edit="1">✏️ Editar dados</button>
    `;
    html += `<div style="height:8px"></div>`;
    html += `
      <div class="resumo-row"><span class="resumo-label">Serviço</span><span class="resumo-value">${SERVICO_EMOJI[servico] || ''} ${escapeHTML(servico)}</span></div>
    `;
    if (taxi) {
      html += `
      <div class="resumo-row"><span class="resumo-label">Táxi Pet</span><span class="resumo-value">
        <span class="resumo-taxi-badge">🚗 Solicitado</span><br>${escapeHTML(endereco)}
      </span></div>`;
    }
    html += `<button type="button" class="resumo-edit" data-edit="2">✏️ Editar serviço</button>`;
    html += `<div style="height:8px"></div>`;
    html += `
      <div class="resumo-row"><span class="resumo-label">Data</span><span class="resumo-value">${data ? formatarDataBR(data) : '—'}</span></div>
      <div class="resumo-row"><span class="resumo-label">Horário</span><span class="resumo-value">${escapeHTML(hora)}</span></div>
    `;
    if (obs) {
      html += `<div class="resumo-row"><span class="resumo-label">Obs.</span><span class="resumo-value">${escapeHTML(obs)}</span></div>`;
    }
    html += `<button type="button" class="resumo-edit" data-edit="3">✏️ Editar data/observações</button>`;

    resumoCard.innerHTML = html;
    resumoCard.querySelectorAll('.resumo-edit').forEach(btn => {
      btn.addEventListener('click', () => irParaEtapa(Number(btn.dataset.edit)));
    });
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ===================== ERROS ===================== */
  function showError(input, msg) {
    input.classList.add('error');
    input.classList.remove('valid');
    const err = input.closest('.form-group')?.querySelector('.form-error');
    if (err) { err.textContent = msg; err.classList.add('show'); }
  }
  function clearError(input) {
    input.classList.remove('error');
    const err = input.closest('.form-group')?.querySelector('.form-error');
    if (err) err.classList.remove('show');
  }

  /* ===================== RASCUNHO (sessionStorage) ===================== */
  const RASCUNHO_KEY = 'petprime_rascunho_agendamento';

  function salvarRascunho() {
    try {
      const dados = {
        nome: form.nome.value, telefone: form.telefone.value, pet: form.pet.value,
        servico: form.servico.value, data: form.data.value, hora: form.hora.value,
        taxiPet: taxiCheck.checked, endereco: form.endereco.value,
        observacoes: form.observacoes.value,
      };
      sessionStorage.setItem(RASCUNHO_KEY, JSON.stringify(dados));
    } catch (e) { /* sessionStorage indisponível — ignora silenciosamente */ }
  }

  function carregarRascunho() {
    try {
      const salvo = sessionStorage.getItem(RASCUNHO_KEY);
      if (!salvo) return;
      const dados = JSON.parse(salvo);
      form.nome.value = dados.nome || '';
      form.telefone.value = dados.telefone || '';
      form.pet.value = dados.pet || '';
      form.servico.value = dados.servico || '';
      form.observacoes.value = dados.observacoes || '';
      obsCount.textContent = form.observacoes.value.length;

      if (dados.taxiPet) {
        taxiCheck.checked = true;
        enderecoWrap.hidden = false;
        inputEndereco.required = true;
        form.endereco.value = dados.endereco || '';
      }
      if (dados.data) {
        form.data.value = dados.data;
        atualizarHorarios();
        if (dados.hora) form.hora.value = dados.hora;
      }
      form.querySelectorAll('input, select').forEach(f => {
        if (f.type !== 'checkbox') marcarValidacao(f);
      });
    } catch (e) { /* rascunho corrompido — ignora */ }
  }
  carregarRascunho();

  /* Salva o rascunho a cada alteração relevante */
  form.addEventListener('input', salvarRascunho);
  form.addEventListener('change', salvarRascunho);

  /* ===================== ENVIO FINAL — MENSAGEM WHATSAPP ===================== */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nome     = form.nome.value.trim();
    const tel      = form.telefone.value.trim();
    const pet      = form.pet.value.trim();
    const servico  = form.servico.value;
    const data     = form.data.value;
    const hora     = form.hora.value;
    const taxi     = taxiCheck.checked;
    const endereco = form.endereco.value.trim();
    const obs      = form.observacoes.value.trim();

    const dataFormatada = data ? formatarDataBR(data) : '';

    let msg = `🐾 *NOVO AGENDAMENTO — PETPRIME* 🐾\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `👤 *Tutor:* ${nome}\n`;
    msg += `📱 *Contato:* ${tel}\n`;
    msg += `🐶 *Pet:* ${pet}\n\n`;

    msg += `${SERVICO_EMOJI[servico] || '🛁'} *Serviço:* ${servico}\n`;
    msg += `📅 *Data:* ${dataFormatada}\n`;
    msg += `🕐 *Horário:* ${hora}\n`;

    if (taxi) {
      msg += `\n🚗 *Táxi Pet:* Sim\n`;
      msg += `📍 *Endereço:* ${endereco}\n`;
    }

    if (obs) {
      msg += `\n📝 *Observações:*\n_${obs}_\n`;
    }

    msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `✅ Enviado pelo site oficial da PetPrime`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/5534998111439?text=${encoded}`, '_blank');

    try { sessionStorage.removeItem(RASCUNHO_KEY); } catch (e) {}
  });
}

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
