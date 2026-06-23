/* ============================================================
   PetPrime — main.js
   Inclui sistema de cálculo automático de preço (client-side)
============================================================ */

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

/* ============================================================
   TABELA DE PREÇOS — edite aqui os valores quando quiser
   sem precisar mexer em mais nada no código.
============================================================ */
const PRECOS = {
  // Preços base por serviço e porte
  servico: {
    'Banho':       { pequeno: 30, medio: 40, grande: 55 },
    'Tosa':        { pequeno: 35, medio: 45, grande: 65 },
    'Banho + Tosa':{ pequeno: 55, medio: 75, grande: 105 },
  },

  // Multiplicadores por tipo de pelagem
  pelagem: {
    curto: 1.00,   // sem acréscimo
    medio: 1.15,   // +15%
    longo: 1.30,   // +30%
  },

  // Taxa extra de desembaraço (nós / pelo emaranhado)
  desembaraco: 15,

  // Táxi Pet
  taxi: {
    taxaFixa: 18,     // taxa de saída fixa
    valorPorKm: 2.50, // por km, já vai multiplicar por 2 (ida + volta)
    // NOTA TÉCNICA: este cálculo usa km informado pelo cliente via faixas pré-definidas,
    // NÃO é calculado por rota real. Para cálculo automático por endereço,
    // seria necessário integrar Google Maps Distance Matrix API ou Mapbox Directions API
    // — isso é um projeto separado com custo de API.
  },
};

/* Mapeamento de km por faixa selecionada */
const TAXI_KM_FAIXA = {
  '3':      3,    // até 5km — usa 3km como estimativa
  '7.5':    7.5,  // 5-10km — usa 7,5km como estimativa
  'consulta': null, // acima de 10km — sem cálculo automático
};

/* Nomes amigáveis para exibição */
const PORTE_LABEL  = { pequeno: 'Pequeno (até 10kg)', medio: 'Médio (10–25kg)', grande: 'Grande (acima de 25kg)' };
const PELAGEM_LABEL= { curto: 'Pelo curto', medio: 'Pelo médio', longo: 'Pelo longo / enrolado' };
const DISTANCIA_LABEL = { '3': 'Até 5km', '7.5': '5km a 10km', 'consulta': 'Acima de 10km' };

/* ============================================================
   FUNÇÃO PRINCIPAL DE CÁLCULO
============================================================ */
function calcularPreco({ servico, porte, pelagem, desembaraco, taxi, distancia }) {
  const linhas = [];
  let total = 0;

  // 1. Preço base
  const precoBase = PRECOS.servico[servico]?.[porte] ?? 0;
  if (!precoBase) return null; // campos incompletos

  linhas.push({ desc: `${servico} (porte ${PORTE_LABEL[porte] || porte})`, valor: precoBase });
  total += precoBase;

  // 2. Acréscimo por pelagem
  const multPelagem = PRECOS.pelagem[pelagem] ?? 1;
  if (multPelagem > 1) {
    const acrescimoPelagem = precoBase * (multPelagem - 1);
    const pct = Math.round((multPelagem - 1) * 100);
    linhas.push({ desc: `${PELAGEM_LABEL[pelagem]} (+${pct}%)`, valor: acrescimoPelagem });
    total += acrescimoPelagem;
  }

  // 3. Desembaraço
  if (desembaraco) {
    linhas.push({ desc: 'Taxa de desembaraço (nós)', valor: PRECOS.desembaraco });
    total += PRECOS.desembaraco;
  }

  // 4. Táxi Pet
  let taxiInfo = null;
  if (taxi && distancia) {
    if (distancia === 'consulta') {
      taxiInfo = { consulta: true };
      linhas.push({ desc: 'Táxi Pet (acima de 10km)', valor: null, consulta: true });
    } else {
      const km = TAXI_KM_FAIXA[distancia];
      const valorTaxi = PRECOS.taxi.taxaFixa + (km * 2 * PRECOS.taxi.valorPorKm);
      taxiInfo = { km, valor: valorTaxi };
      linhas.push({
        desc: `Táxi Pet (${DISTANCIA_LABEL[distancia]}, ~${km}km × 2)`,
        valor: valorTaxi
      });
      total += valorTaxi;
    }
  }

  return { linhas, total, taxiConsulta: taxiInfo?.consulta ?? false };
}

function formatBRL(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/* ── Formulário de agendamento (multi-etapas) ── */
const form = document.getElementById('form-agendamento');

if (form) {

  /* — Feriados nacionais fixos (MM-DD) — */
  const FERIADOS_FIXOS = new Set([
    '01-01','04-21','05-01','09-07','10-12','11-02','11-15','11-20','12-25',
  ]);

  function calcularPascoa(ano) {
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
      `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    );
  }

  function chaveData(date) {
    return `${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }
  function ehFeriado(date) {
    const chave = chaveData(date);
    return FERIADOS_FIXOS.has(chave) || feriadosMoveis(date.getFullYear()).includes(chave);
  }
  function parseDataLocal(valorISO) {
    const [y, m, d] = valorISO.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  function statusDoDia(date) {
    const dia = date.getDay();
    if (ehFeriado(date)) return 'feriado';
    if (dia === 0 || dia === 6) return 'fechado';
    return 'normal';
  }

  const HORARIOS = {
    normal:  ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'],
    feriado: ['08:00','09:00','10:00','11:00'],
    fechado: [],
  };

  /* — Referências — */
  const inputData     = form.querySelector('#data');
  const selectHora    = form.querySelector('#hora');
  const dataHint      = form.querySelector('#data-hint');
  const inputTel      = form.querySelector('#telefone');
  const taxiCheck     = form.querySelector('#taxi-pet');
  const taxiFields    = form.querySelector('#taxi-fields');
  const inputEndereco = form.querySelector('#endereco');
  const selectDist    = form.querySelector('#distancia');
  const desembaracoChk= form.querySelector('#desembaraco');
  const obsField      = form.querySelector('#observacoes');
  const obsCount      = form.querySelector('#obs-count');
  const resumoCard    = form.querySelector('#resumo-card');
  const precoResumo   = form.querySelector('#preco-resumo');
  const precoPreview  = form.querySelector('#preco-preview');
  const precoPreviewDet = form.querySelector('#preco-preview-detalhes');
  const precoPreviewTotal = form.querySelector('#preco-preview-total');

  /* — Datas — */
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const dataMax = new Date(hoje); dataMax.setDate(dataMax.getDate() + 60);
  function isoDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  if (inputData) { inputData.min = isoDate(hoje); inputData.max = isoDate(dataMax); }

  function atualizarHorarios() {
    if (!inputData.value) {
      selectHora.innerHTML = '<option value="">Escolha a data primeiro</option>';
      selectHora.disabled = true;
      dataHint.textContent = '';
      inputData.classList.remove('valid','error');
      return;
    }
    const dataEscolhida = parseDataLocal(inputData.value);
    const status = statusDoDia(dataEscolhida);
    if (status === 'fechado') {
      selectHora.innerHTML = '<option value="">Fechado nesta data</option>';
      selectHora.disabled = true;
      dataHint.textContent = '⚠️ Não atendemos aos sábados e domingos. Escolha outro dia.';
      dataHint.style.color = '#E53935';
      inputData.classList.remove('valid'); inputData.classList.add('error');
      return;
    }
    inputData.classList.remove('error'); inputData.classList.add('valid');
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

  /* — Máscara telefone — */
  function maskTelefone(value) {
    const digits = value.replace(/\D/g,'').slice(0,11);
    if (digits.length <= 2) return digits.replace(/^(\d*)/, '($1');
    if (digits.length <= 7) return digits.replace(/^(\d{2})(\d*)/, '($1) $2');
    return digits.replace(/^(\d{2})(\d{4,5})(\d{0,4})/, (m,a,b,c) =>
      c ? `(${a}) ${b}-${c}` : `(${a}) ${b}`
    );
  }
  inputTel?.addEventListener('input', () => { inputTel.value = maskTelefone(inputTel.value); });

  /* — Contador observações — */
  obsField?.addEventListener('input', () => { obsCount.textContent = obsField.value.length; });

  /* — Táxi Pet: mostrar/ocultar campos — */
  taxiCheck?.addEventListener('change', () => {
    taxiFields.hidden = !taxiCheck.checked;
    if (inputEndereco) inputEndereco.required = taxiCheck.checked;
    if (!taxiCheck.checked) {
      if (inputEndereco) { inputEndereco.value = ''; inputEndereco.classList.remove('valid','error'); }
      if (selectDist) { selectDist.value = ''; }
    }
    atualizarPrecoPreview();
    salvarRascunho();
  });

  /* — Feedback check verde — */
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

  /* ===================== PREVIEW DE PREÇO (Etapa 2) ===================== */
  function atualizarPrecoPreview() {
    const servico  = form.servico?.value;
    const porte    = form.porte?.value;
    const pelagem  = form.pelagem?.value;
    const desemb   = desembaracoChk?.checked ?? false;
    const taxi     = taxiCheck?.checked ?? false;
    const distancia= selectDist?.value ?? '';

    // Só mostra quando serviço + porte + pelagem preenchidos
    if (!servico || !porte || !pelagem) {
      if (precoPreview) precoPreview.hidden = true;
      return;
    }

    const resultado = calcularPreco({ servico, porte, pelagem, desembaraco: desemb, taxi, distancia });
    if (!resultado) { if (precoPreview) precoPreview.hidden = true; return; }

    // Monta linhas do preview
    let html = '';
    resultado.linhas.forEach(l => {
      html += `<div class="preco-linha">
        <span>${l.desc}</span>
        <span>${l.consulta ? 'sob consulta' : formatBRL(l.valor)}</span>
      </div>`;
    });
    if (precoPreviewDet) precoPreviewDet.innerHTML = html;

    if (precoPreviewTotal) {
      if (resultado.taxiConsulta) {
        precoPreviewTotal.innerHTML = `Total estimado: <strong id="preco-preview-total">${formatBRL(resultado.total)} + táxi (sob consulta)</strong>`;
      } else {
        precoPreviewTotal.innerHTML = `Total estimado: <strong id="preco-preview-total">${formatBRL(resultado.total)}</strong>`;
      }
    }

    if (precoPreview) precoPreview.hidden = false;
  }

  // Atualiza preview ao mudar qualquer campo da Etapa 2
  ['servico','porte','pelagem'].forEach(id => {
    form.querySelector(`#${id}`)?.addEventListener('change', atualizarPrecoPreview);
  });
  desembaracoChk?.addEventListener('change', atualizarPrecoPreview);
  selectDist?.addEventListener('change', atualizarPrecoPreview);

  /* ===================== NAVEGAÇÃO ENTRE ETAPAS ===================== */
  function irParaEtapa(num) {
    form.querySelectorAll('.form-stage').forEach(s => s.classList.remove('active'));
    form.querySelectorAll('.form-step').forEach(s => {
      s.classList.remove('active','done');
      const n = Number(s.dataset.step);
      if (n < num) s.classList.add('done');
      if (n === num) s.classList.add('active');
    });
    const alvo = form.querySelector(`.form-stage[data-stage="${num}"]`);
    if (alvo) alvo.classList.add('active');
    if (num === 4) { montarResumo(); montarPrecoResumo(); }
    form.closest('.form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function validarEtapa(fieldset) {
    let ok = true;
    fieldset.querySelectorAll('input[required], select[required]').forEach(f => {
      clearError(f);
      if (!f.value.trim()) { showError(f, 'Campo obrigatório.'); ok = false; }
      else if (f.type === 'tel' && !/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/.test(f.value.trim())) {
        showError(f, 'Telefone inválido. Ex: (34) 99999-9999'); ok = false;
      } else if (f.id === 'data' && f.classList.contains('error')) {
        showError(f, 'Escolha uma data disponível.'); ok = false;
      }
    });
    return ok;
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

  /* ===================== RESUMO ETAPA 4 ===================== */
  const SERVICO_EMOJI = { 'Banho': '🛁', 'Tosa': '✂️', 'Banho + Tosa': '🐶' };

  function formatarDataBR(valorISO) {
    const d = parseDataLocal(valorISO);
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function montarResumo() {
    const nome    = form.nome.value.trim();
    const tel     = form.telefone.value.trim();
    const pet     = form.pet.value.trim();
    const servico = form.servico.value;
    const porte   = form.porte?.value;
    const pelagem = form.pelagem?.value;
    const peso    = form.peso?.value;
    const data    = form.data.value;
    const hora    = form.hora.value;
    const taxi    = taxiCheck.checked;
    const endereco= form.endereco?.value.trim();
    const distancia= selectDist?.value;
    const desemb  = desembaracoChk?.checked;
    const obs     = form.observacoes.value.trim();

    let html = `
      <div class="resumo-row"><span class="resumo-label">Nome</span><span class="resumo-value">${escapeHTML(nome)}</span></div>
      <div class="resumo-row"><span class="resumo-label">WhatsApp</span><span class="resumo-value">${escapeHTML(tel)}</span></div>
      <div class="resumo-row"><span class="resumo-label">Pet</span><span class="resumo-value">${escapeHTML(pet)}${peso ? ` · ${peso}kg` : ''}</span></div>
      <button type="button" class="resumo-edit" data-edit="1">✏️ Editar dados</button>
      <div style="height:8px"></div>
      <div class="resumo-row"><span class="resumo-label">Serviço</span><span class="resumo-value">${SERVICO_EMOJI[servico]||''} ${escapeHTML(servico)}</span></div>
      <div class="resumo-row"><span class="resumo-label">Porte</span><span class="resumo-value">${escapeHTML(PORTE_LABEL[porte]||porte)}</span></div>
      <div class="resumo-row"><span class="resumo-label">Pelagem</span><span class="resumo-value">${escapeHTML(PELAGEM_LABEL[pelagem]||pelagem)}</span></div>
    `;
    if (desemb) html += `<div class="resumo-row"><span class="resumo-label">Desembaraço</span><span class="resumo-value">🪢 Sim (+R$ 15,00)</span></div>`;
    if (taxi) {
      html += `<div class="resumo-row"><span class="resumo-label">Táxi Pet</span><span class="resumo-value">🚗 Solicitado${endereco ? `<br><small>${escapeHTML(endereco)}</small>` : ''}</span></div>`;
      if (distancia) html += `<div class="resumo-row"><span class="resumo-label">Distância</span><span class="resumo-value">${escapeHTML(DISTANCIA_LABEL[distancia]||distancia)}</span></div>`;
    }
    html += `<button type="button" class="resumo-edit" data-edit="2">✏️ Editar serviço</button>`;
    html += `<div style="height:8px"></div>`;
    html += `
      <div class="resumo-row"><span class="resumo-label">Data</span><span class="resumo-value">${data ? formatarDataBR(data) : '—'}</span></div>
      <div class="resumo-row"><span class="resumo-label">Horário</span><span class="resumo-value">${escapeHTML(hora)}</span></div>
    `;
    if (obs) html += `<div class="resumo-row"><span class="resumo-label">Obs.</span><span class="resumo-value">${escapeHTML(obs)}</span></div>`;
    html += `<button type="button" class="resumo-edit" data-edit="3">✏️ Editar data/observações</button>`;

    resumoCard.innerHTML = html;
    resumoCard.querySelectorAll('.resumo-edit').forEach(btn => {
      btn.addEventListener('click', () => irParaEtapa(Number(btn.dataset.edit)));
    });
  }

  /* ===================== DETALHAMENTO DE PREÇO (Etapa 4) ===================== */
  function montarPrecoResumo() {
    if (!precoResumo) return;

    const servico  = form.servico?.value;
    const porte    = form.porte?.value;
    const pelagem  = form.pelagem?.value;
    const desemb   = desembaracoChk?.checked ?? false;
    const taxi     = taxiCheck?.checked ?? false;
    const distancia= selectDist?.value ?? '';

    const resultado = calcularPreco({ servico, porte, pelagem, desembaraco: desemb, taxi, distancia });

    if (!resultado) {
      precoResumo.innerHTML = '';
      return;
    }

    let linhasHTML = resultado.linhas.map(l => `
      <div class="preco-resumo-linha">
        <span>${l.desc}</span>
        <span>${l.consulta ? '<em>sob consulta</em>' : formatBRL(l.valor)}</span>
      </div>
    `).join('');

    const totalStr = resultado.taxiConsulta
      ? `${formatBRL(resultado.total)} <small>+ táxi sob consulta</small>`
      : formatBRL(resultado.total);

    precoResumo.innerHTML = `
      <div class="preco-resumo-titulo">💰 Detalhamento do valor</div>
      ${linhasHTML}
      <div class="preco-resumo-total">
        <span>Total estimado</span>
        <span>${totalStr}</span>
      </div>
    `;
  }

  /* ===================== ERROS ===================== */
  function showError(input, msg) {
    input.classList.add('error'); input.classList.remove('valid');
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
      sessionStorage.setItem(RASCUNHO_KEY, JSON.stringify({
        nome: form.nome.value, telefone: form.telefone.value, pet: form.pet.value,
        peso: form.peso?.value || '',
        servico: form.servico.value,
        porte: form.porte?.value || '',
        pelagem: form.pelagem?.value || '',
        desembaraco: desembaracoChk?.checked || false,
        taxiPet: taxiCheck.checked,
        endereco: form.endereco?.value || '',
        distancia: selectDist?.value || '',
        data: form.data.value, hora: form.hora.value,
        observacoes: form.observacoes.value,
      }));
    } catch (e) {}
  }

  function carregarRascunho() {
    try {
      const salvo = sessionStorage.getItem(RASCUNHO_KEY);
      if (!salvo) return;
      const d = JSON.parse(salvo);
      form.nome.value = d.nome || '';
      form.telefone.value = d.telefone || '';
      form.pet.value = d.pet || '';
      if (form.peso) form.peso.value = d.peso || '';
      form.servico.value = d.servico || '';
      if (form.porte) form.porte.value = d.porte || '';
      if (form.pelagem) form.pelagem.value = d.pelagem || '';
      if (desembaracoChk && d.desembaraco) desembaracoChk.checked = true;
      if (d.taxiPet && taxiCheck) {
        taxiCheck.checked = true;
        if (taxiFields) taxiFields.hidden = false;
        if (inputEndereco) { inputEndereco.required = true; inputEndereco.value = d.endereco || ''; }
        if (selectDist) selectDist.value = d.distancia || '';
      }
      form.observacoes.value = d.observacoes || '';
      if (obsCount) obsCount.textContent = form.observacoes.value.length;
      if (d.data) { form.data.value = d.data; atualizarHorarios(); if (d.hora) form.hora.value = d.hora; }
      form.querySelectorAll('input, select').forEach(f => { if (f.type !== 'checkbox') marcarValidacao(f); });
      atualizarPrecoPreview();
    } catch (e) {}
  }
  carregarRascunho();
  form.addEventListener('input', salvarRascunho);
  form.addEventListener('change', salvarRascunho);

  /* ===================== ENVIO — WHATSAPP ===================== */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nome     = form.nome.value.trim();
    const tel      = form.telefone.value.trim();
    const pet      = form.pet.value.trim();
    const peso     = form.peso?.value.trim();
    const servico  = form.servico.value;
    const porte    = form.porte?.value;
    const pelagem  = form.pelagem?.value;
    const desemb   = desembaracoChk?.checked;
    const data     = form.data.value;
    const hora     = form.hora.value;
    const taxi     = taxiCheck.checked;
    const endereco = form.endereco?.value.trim();
    const distancia= selectDist?.value;
    const obs      = form.observacoes.value.trim();

    const dataFormatada = data ? formatarDataBR(data) : '';

    // Calcula preço para incluir na mensagem
    const resultado = calcularPreco({ servico, porte, pelagem, desembaraco: desemb, taxi, distancia });

    let msg = `🐾 *NOVO AGENDAMENTO — PETPRIME* 🐾\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `👤 *Tutor:* ${nome}\n`;
    msg += `📱 *Contato:* ${tel}\n`;
    msg += `🐶 *Pet:* ${pet}${peso ? ` (${peso}kg)` : ''}\n\n`;
    msg += `${SERVICO_EMOJI[servico]||'🛁'} *Serviço:* ${servico}\n`;
    msg += `📏 *Porte:* ${PORTE_LABEL[porte]||porte}\n`;
    msg += `🐾 *Pelagem:* ${PELAGEM_LABEL[pelagem]||pelagem}\n`;
    if (desemb) msg += `🪢 *Desembaraço:* Sim (nós/emaranhado)\n`;
    msg += `📅 *Data:* ${dataFormatada}\n`;
    msg += `🕐 *Horário:* ${hora}\n`;

    if (taxi) {
      msg += `\n🚗 *Táxi Pet:* Sim\n`;
      if (endereco) msg += `📍 *Endereço:* ${endereco}\n`;
      if (distancia) msg += `📐 *Distância:* ${DISTANCIA_LABEL[distancia]||distancia}\n`;
    }

    // Bloco de preço
    if (resultado) {
      msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `💰 *ESTIMATIVA DE VALOR*\n`;
      resultado.linhas.forEach(l => {
        msg += `  • ${l.desc}: ${l.consulta ? 'sob consulta' : formatBRL(l.valor)}\n`;
      });
      if (resultado.taxiConsulta) {
        msg += `  💬 *Total (sem táxi):* ${formatBRL(resultado.total)} + táxi sob consulta\n`;
      } else {
        msg += `  ✅ *Total estimado:* ${formatBRL(resultado.total)}\n`;
      }
      msg += `  _(Valor estimado. Confirmação final pelo WhatsApp.)_\n`;
    }

    if (obs) msg += `\n📝 *Observações:*\n_${obs}_\n`;

    msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `✅ Enviado pelo site oficial da PetPrime`;

    window.open(`https://wa.me/5534998111439?text=${encodeURIComponent(msg)}`, '_blank');

    try { sessionStorage.removeItem(RASCUNHO_KEY); } catch (e) {}
  });

} // fim if(form)

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
  document.querySelectorAll('img[data-src]').forEach(img => { img.src = img.dataset.src; });
} else {
  const lazyObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.src = e.target.dataset.src; lazyObs.unobserve(e.target); }
    });
  });
  document.querySelectorAll('img[data-src]').forEach(img => lazyObs.observe(img));
}

/* ── Smooth scroll ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});
