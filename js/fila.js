/* =========================================================================
   FILA DE IMPRESSÃO (fila.html)
   - Fila geral: impressões que ainda não foram para nenhuma impressora.
   - Cards das impressoras (acima da fila): cada uma recebe uma impressão por vez.
   Tudo filtrado pelo ?espaco_id= da URL. Carregar DEPOIS de js/script.js.
   RPCs usadas: listar_impressoras, listar_impressoes, adicionar_impressao,
   enviar_para_impressora, atualizar_status_impressao, remover_impressao.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', function () {
  var espacoId = new URLSearchParams(window.location.search).get('espaco_id');
  var container = document.getElementById('queueGroups');
  var slotsEl = document.getElementById('printerSlots');
  var resumo = document.getElementById('queueSummary');
  var emptyState = document.getElementById('queueEmptyState');
  var searchInput = document.getElementById('queueSearch');
  var novaBtn = document.getElementById('novaImpressaoBtn');

  if (!espacoId) {
    showToast('Atenção', 'Nenhum espaço selecionado. Escolha um em "Meus espaços".', 'error');
    setTimeout(function () { window.location.href = 'espacos.html'; }, 1500);
    return;
  }

  var ehGestor = false; // Dono ou Operador
  var impressoras = [];
  var jobs = [];
  var permissoesProntas = obterPermissoes().then(function (d) {
    ehGestor = !!d && (d.cargo === 'Dono' || d.cargo === 'Operador');
  });

  var TIPOS = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'Nylon', 'Outro'];
  var BADGES = {
    'imprimindo': ['badge-success', 'Imprimindo'],
    'na-fila': ['badge-info', 'Na fila'],
    'pausado': ['badge-neutral', 'Pausado'],
    'erro': ['badge-danger', 'Erro'],
    'concluido': ['badge-success', 'Concluído']
  };
  var HANDLE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>';
  var PRINTER_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="9" width="16" height="7" rx="1.5"/><path d="M7 9V6a2 2 0 012-2h6a2 2 0 012 2v3"/><path d="M7 16v2a1 1 0 001 1h8a1 1 0 001-1v-2"/></svg>';

  function esc(t) {
    var d = document.createElement('div');
    d.textContent = t == null ? '' : String(t);
    return d.innerHTML;
  }

  function fmtTempo(min, status) {
    if (status === 'concluido') return 'Concluído';
    if (!min) return '—';
    var h = Math.floor(min / 60), m = min % 60;
    return (h ? h + 'h ' : '') + (m || !h ? m + 'm' : '');
  }

  function btn(j, acao, icone, label, perigo) {
    return '<button type="button" class="btn-icon btn-icon--sm' + (perigo ? ' btn-icon--danger' : '') +
      '" data-acao="' + acao + '" data-id="' + j.id + '" aria-label="' + label + '" title="' + label + '"><i data-lucide="' + icone + '"></i></button>';
  }

  // Fila geral: só "enviar para impressora" e "excluir"
  function acoesFila(j) {
    if (ehGestor) return btn(j, 'enviar', 'arrow-up', 'Enviar para impressora') + btn(j, 'remover', 'trash-2', 'Excluir', true);
    // Maker: só remove a própria impressão
    return j.meu ? btn(j, 'remover', 'trash-2', 'Excluir', true) : '';
  }

  // Dentro da impressora: controles de impressão
  function acoesImpressora(j) {
    if (ehGestor) {
      if (j.status === 'imprimindo') return btn(j, 'pausado', 'pause', 'Pausar') + btn(j, 'concluido', 'check', 'Concluir') + btn(j, 'erro', 'alert-triangle', 'Marcar erro', true);
      if (j.status === 'na-fila') return btn(j, 'imprimindo', 'play', 'Iniciar') + btn(j, 'remover', 'trash-2', 'Remover', true);
      if (j.status === 'pausado') return btn(j, 'imprimindo', 'play', 'Retomar') + btn(j, 'remover', 'x', 'Cancelar', true);
      if (j.status === 'erro') return btn(j, 'devolver', 'refresh-cw', 'Devolver à fila') + btn(j, 'remover', 'trash-2', 'Remover', true);
      return '';
    }
    return (j.meu && j.status === 'na-fila') ? btn(j, 'remover', 'trash-2', 'Remover', true) : '';
  }

  function subtitulo(j) {
    return [j.autor || '—', j.peso_g ? j.peso_g + 'g' : null, j.camada_mm ? j.camada_mm + 'mm' : null]
      .filter(Boolean).join(' · ');
  }

  /* ---------- Fila geral (impressões sem impressora) ---------- */
  function linha(j, i) {
    var b = BADGES[j.status] || BADGES['na-fila'];
    return '<div class="job-row" data-status="' + j.status + '" data-title="' + esc((j.titulo + ' ' + (j.autor || '')).toLowerCase()) + '">' +
      '<span class="job-row__handle" aria-hidden="true">' + HANDLE + '</span>' +
      '<span class="job-row__index">' + String(i + 1).padStart(2, '0') + '</span>' +
      '<span class="job-material-chip">' + esc(j.material || '—') + '</span>' +
      '<div class="job-row__info"><div class="job-row__title">' + esc(j.titulo) + '</div>' +
        '<div class="job-row__subtitle">' + esc(subtitulo(j)) + '</div></div>' +
      '<span class="job-row__color">' + esc(j.cor || '—') + '</span>' +
      '<div class="job-progress"><div class="job-progress__row"><div class="progress-bar"><div class="progress-bar__fill" style="width:' + j.progresso + '%;"></div></div>' +
        '<span class="job-progress__pct">' + j.progresso + '%</span></div></div>' +
      '<span class="job-row__time">' + fmtTempo(j.tempo_min, j.status) + '</span>' +
      '<div style="display:flex; align-items:center; gap: var(--space-3);"><span class="badge ' + b[0] + '">' + b[1] + '</span>' +
        '<div class="job-row__actions">' + acoesFila(j) + '</div></div></div>';
  }

  /* ---------- Cards das impressoras ---------- */
  function jobDaImpressora(imp) {
    return jobs.find(function (j) { return j.impressora_id === imp.id && j.status !== 'concluido'; }) || null;
  }

  function slotJob(j) {
    var b = BADGES[j.status] || BADGES['na-fila'];
    var fill = j.status === 'erro'
      ? ' style="width:' + j.progresso + '%; background:linear-gradient(90deg, var(--color-danger), #ff8a94);"'
      : ' style="width:' + j.progresso + '%;"';
    return '<div class="slot-job" data-id="' + j.id + '">' +
      '<div class="slot-job__top"><span class="job-material-chip">' + esc(j.material || '—') + '</span>' +
        '<div class="job-row__info"><div class="job-row__title">' + esc(j.titulo) + '</div>' +
        '<div class="job-row__subtitle">' + esc(subtitulo(j)) + '</div></div></div>' +
      '<div class="job-progress"><div class="job-progress__row"><div class="progress-bar"><div class="progress-bar__fill"' + fill + '></div></div>' +
        '<span class="job-progress__pct">' + j.progresso + '%</span></div></div>' +
      '<div class="slot-job__foot"><div class="slot-job__meta"><span class="badge ' + b[0] + '">' + b[1] + '</span>' +
        '<span class="job-row__time">' + fmtTempo(j.tempo_min, j.status) + '</span></div>' +
        '<div class="job-row__actions">' + acoesImpressora(j) + '</div></div></div>';
  }

  function cardImpressora(imp) {
    var j = jobDaImpressora(imp);
    var dot = !j ? 'idle' : j.status === 'erro' ? 'danger' : j.status === 'pausado' ? 'warning' : j.status === 'na-fila' ? 'info' : '';
    return '<article class="card card-printer slot-card">' +
      '<div class="card-printer__head"><div class="card-printer__icon">' + PRINTER_ICON + '</div>' +
        '<div><h3 class="card-printer__name">' + esc(imp.nome) + '</h3>' +
        '<span class="card-printer__count"><span class="status-dot' + (dot ? ' status-dot--' + dot : '') + '" style="display:inline-block; margin-right:6px;"></span>' + (j ? 'Ocupada' : 'Livre') + '</span></div></div>' +
      (j ? slotJob(j) : '<div class="slot-empty">Sem nenhuma impressão</div>') + '</article>';
  }

  function render() {
    var fila = jobs.filter(function (j) { return !j.impressora_id; });
    var imprimindo = jobs.filter(function (j) { return j.status === 'imprimindo'; }).length;
    resumo.textContent = fila.length + ' na fila · ' + imprimindo + ' imprimindo agora';

    // Impressoras
    slotsEl.innerHTML = impressoras.length
      ? impressoras.map(cardImpressora).join('')
      : '<p class="text-muted" style="grid-column:1/-1; text-align:center; padding: var(--space-6) 0;">Este espaço ainda não tem impressoras. Cadastre uma em "Impressoras" para enviar impressões.</p>';

    // Fila geral
    container.innerHTML = '<div class="printer-group"><div class="printer-group__header">' +
      '<span class="status-dot' + (fila.length ? ' status-dot--info' : ' status-dot--idle') + '"></span>' +
      '<span class="printer-group__name">Fila geral</span>' +
      '<span class="printer-group__meta">' + fila.length + ' aguardando</span></div>' +
      (fila.length ? '<div class="printer-group__rows">' + fila.map(linha).join('') + '</div>'
                   : '<div class="printer-group__empty">Fila vazia</div>') + '</div>';

    renderizarIconesLucide();
    aplicarFiltros();
  }

  function aplicarFiltros() {
    var termo = (searchInput.value || '').trim().toLowerCase();
    var rows = container.querySelectorAll('.job-row');
    var algum = false;
    rows.forEach(function (r) {
      var ok = !termo || r.dataset.title.indexOf(termo) !== -1;
      r.style.display = ok ? '' : 'none';
      if (ok) algum = true;
    });
    emptyState.style.display = (!rows.length || algum) ? 'none' : '';
  }

  function carregar() {
    return Promise.all([
      permissoesProntas,
      supabaseClient.rpc('listar_impressoras', { p_espaco_id: espacoId }),
      supabaseClient.rpc('listar_impressoes', { p_espaco_id: espacoId })
    ]).then(function (r) {
      if (r[1].error || r[2].error) {
        showToast('Erro', 'Não foi possível carregar a fila.', 'error');
        return;
      }
      impressoras = r[1].data || [];
      jobs = r[2].data || [];
      render();
    });
  }

  searchInput.addEventListener('input', aplicarFiltros);

  /* ---------- Ações (delegado: o conteúdo é recriado) ---------- */
  async function tratarAcao(e) {
    var b = e.target.closest('[data-acao]');
    if (!b) return;
    var id = Number(b.getAttribute('data-id'));
    var acao = b.getAttribute('data-acao');
    var job = jobs.find(function (j) { return j.id === id; });
    var nome = job ? job.titulo : 'esta impressão';
    var r;

    if (acao === 'enviar') { abrirSelecao(job); return; }

    if (acao === 'concluido') {
      var ok = await confirmarConclusao(nome);
      if (!ok) return;
    }

    if (acao === 'remover') {
      var confirmarRemocao = await confirmarAcao({
        titulo: 'Remover impressão',
        mensagem: 'Remover "' + nome + '"?',
        textoConfirmar: 'Remover',
        perigo: true
      });
      if (!confirmarRemocao) return;
      r = await supabaseClient.rpc('remover_impressao', { p_impressao_id: id });
    } else if (acao === 'devolver') {
      r = await supabaseClient.rpc('enviar_para_impressora', { p_impressao_id: id, p_impressora_id: null });
    } else {
      r = await supabaseClient.rpc('atualizar_status_impressao', { p_impressao_id: id, p_status: acao });
    }
    if (r.error) { showToast('Erro', esc(r.error.message), 'error'); return; }
    carregar();
  }
  container.addEventListener('click', tratarAcao);
  slotsEl.addEventListener('click', tratarAcao);

  /* ---------- Modal "Enviar para impressora" ---------- */
  var selecaoEl = document.createElement('div');
  selecaoEl.innerHTML =
    '<div class="modal-overlay" id="enviarOverlay"><div class="modal">' +
      '<div class="modal__head"><h3 class="modal__title">Enviar para impressora</h3>' +
      '<button class="modal__close" type="button" id="enviarClose" aria-label="Fechar"><i data-lucide="x"></i></button></div>' +
      '<div class="modal__body"><p id="enviarMsg"></p><div class="pick-list" id="enviarLista" style="margin-top: var(--space-4);"></div></div>' +
      '<div class="modal__actions"><button type="button" class="btn btn-outline" id="enviarCancelar">Cancelar</button></div>' +
    '</div></div>';
  document.body.appendChild(selecaoEl);
  renderizarIconesLucide();

  var enviarOverlay = document.getElementById('enviarOverlay');
  var enviarLista = document.getElementById('enviarLista');
  var enviarAlvoId = null;

  function fecharSelecao() {
    enviarOverlay.classList.remove('is-open');
    enviarAlvoId = null;
  }

  function abrirSelecao(job) {
    if (!job) return;
    if (!impressoras.length) {
      showToast('Atenção', 'Cadastre uma impressora antes de enviar uma impressão.', 'error');
      return;
    }
    enviarAlvoId = job.id;
    document.getElementById('enviarMsg').textContent = 'Escolha a impressora para "' + job.titulo + '".';
    enviarLista.innerHTML = impressoras.map(function (imp) {
      var ocupada = jobDaImpressora(imp);
      return '<button type="button" class="pick-item" data-imp-id="' + imp.id + '"' + (ocupada ? ' disabled' : '') + '>' +
        '<span class="pick-item__name">' + esc(imp.nome) + '</span>' +
        '<span class="pick-item__state">' + (ocupada ? 'Ocupada' : 'Livre') + '</span></button>';
    }).join('');
    enviarOverlay.classList.add('is-open');
  }

  enviarLista.addEventListener('click', async function (e) {
    var item = e.target.closest('[data-imp-id]');
    if (!item || item.disabled || enviarAlvoId == null) return;

    var impId = Number(item.getAttribute('data-imp-id'));
    var imp = impressoras.find(function (i) { return i.id === impId; });
    var alvo = enviarAlvoId;
    enviarLista.querySelectorAll('button').forEach(function (b) { b.disabled = true; });

    var r = await supabaseClient.rpc('enviar_para_impressora', { p_impressao_id: alvo, p_impressora_id: impId });
    if (r.error) {
      showToast('Erro', esc(r.error.message), 'error');
      fecharSelecao();
      carregar();
      return;
    }
    showToast('Sucesso', 'Impressão enviada para ' + esc(imp ? imp.nome : 'a impressora') + '!', 'success');
    fecharSelecao();
    carregar();
  });

  document.getElementById('enviarClose').addEventListener('click', fecharSelecao);
  document.getElementById('enviarCancelar').addEventListener('click', fecharSelecao);
  enviarOverlay.addEventListener('click', function (e) { if (e.target === enviarOverlay) fecharSelecao(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && enviarOverlay.classList.contains('is-open')) fecharSelecao();
  });

  /* ---------- Modal "Nova impressão" (sem escolher impressora) ---------- */
  var modal = document.createElement('div');
  modal.innerHTML =
    '<div class="modal-overlay" id="impressaoOverlay"><div class="modal">' +
      '<div class="modal__head"><h3 class="modal__title">Nova impressão</h3>' +
      '<button class="modal__close" type="button" id="impressaoClose" aria-label="Fechar"><i data-lucide="x"></i></button></div>' +
      '<div class="modal__body"><form id="impressaoForm">' +
        '<div class="form-group"><label class="form-label" for="impTitulo">Modelo</label>' +
          '<input class="form-input" type="text" id="impTitulo" placeholder="Ex: Suporte de câmera" maxlength="80" required></div>' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label" for="impMaterial">Material</label>' +
            '<select class="form-select" id="impMaterial"><option value="">Não informado</option>' +
              TIPOS.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></div>' +
          '<div class="form-group"><label class="form-label" for="impCor">Cor</label>' +
            '<input class="form-input" type="text" id="impCor" placeholder="Ex: Branco" maxlength="40"></div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group"><label class="form-label" for="impPeso">Peso (g)</label>' +
            '<input class="form-input" type="number" id="impPeso" min="0" step="0.1" placeholder="38"></div>' +
          '<div class="form-group"><label class="form-label" for="impCamada">Camada (mm)</label>' +
            '<select class="form-select" id="impCamada"><option>0.12</option><option>0.16</option><option selected>0.2</option><option>0.28</option></select></div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group" style="margin-bottom:0;"><label class="form-label" for="impHoras">Horas</label>' +
            '<input class="form-input" type="number" id="impHoras" min="0" value="0"></div>' +
          '<div class="form-group" style="margin-bottom:0;"><label class="form-label" for="impMinutos">Minutos</label>' +
            '<input class="form-input" type="number" id="impMinutos" min="0" max="59" value="0"></div>' +
        '</div></form></div>' +
      '<div class="modal__actions"><button type="button" class="btn btn-outline" id="impressaoCancelar">Cancelar</button>' +
        '<button type="submit" form="impressaoForm" class="btn btn-primary">Adicionar à fila</button></div>' +
    '</div></div>';
  document.body.appendChild(modal);
  renderizarIconesLucide();

  var overlay = document.getElementById('impressaoOverlay');

  function abrirModal() {
    overlay.classList.add('is-open');
    document.getElementById('impTitulo').focus();
  }
  function fecharModal() {
    overlay.classList.remove('is-open');
    document.getElementById('impressaoForm').reset();
  }

  novaBtn.addEventListener('click', abrirModal);
  document.getElementById('impressaoClose').addEventListener('click', fecharModal);
  document.getElementById('impressaoCancelar').addEventListener('click', fecharModal);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) fecharModal(); });

  document.getElementById('impressaoForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var titulo = document.getElementById('impTitulo').value.trim();
    if (!titulo) return;

    var peso = document.getElementById('impPeso').value;
    var tempo = (Number(document.getElementById('impHoras').value) || 0) * 60 +
                (Number(document.getElementById('impMinutos').value) || 0);

    var r = await supabaseClient.rpc('adicionar_impressao', {
      p_espaco_id: espacoId,
      p_titulo: titulo,
      p_material: document.getElementById('impMaterial').value || null,
      p_cor: document.getElementById('impCor').value.trim() || null,
      p_peso: peso ? Number(peso) : null,
      p_camada: Number(document.getElementById('impCamada').value),
      p_tempo_min: tempo || null
    });
    if (r.error) { showToast('Erro', esc(r.error.message), 'error'); return; }

    showToast('Sucesso', 'Impressão adicionada à fila!', 'success');
    fecharModal();
    carregar();
  });

  /* ---------- Modal de confirmação ao concluir ---------- */
  var confirmEl = document.createElement('div');
  confirmEl.innerHTML =
    '<div class="modal-overlay" id="concluirOverlay"><div class="modal">' +
      '<div class="modal__head"><h3 class="modal__title">Concluir impressão</h3>' +
      '<button class="modal__close" type="button" id="concluirClose" aria-label="Fechar"><i data-lucide="x"></i></button></div>' +
      '<div class="modal__body"><p id="concluirMsg"></p></div>' +
      '<div class="modal__actions">' +
        '<button type="button" class="btn btn-outline" id="concluirCancelar">Cancelar</button>' +
        '<button type="button" class="btn btn-primary" id="concluirConfirmar">Confirmar</button>' +
      '</div></div></div>';
  document.body.appendChild(confirmEl);
  renderizarIconesLucide();

  var concluirOverlay = document.getElementById('concluirOverlay');
  var concluirResolver = null;

  function fecharConfirmacao(resultado) {
    concluirOverlay.classList.remove('is-open');
    if (concluirResolver) {
      concluirResolver(resultado);
      concluirResolver = null;
    }
  }

  // Devolve uma Promise<boolean>: true = Confirmar, false = Cancelar/fechar
  function confirmarConclusao(nomeModelo) {
    document.getElementById('concluirMsg').textContent =
      'Marcar "' + nomeModelo + '" como concluída? O progresso vai para 100% e a impressora fica livre.';
    concluirOverlay.classList.add('is-open');
    document.getElementById('concluirConfirmar').focus();
    return new Promise(function (resolve) { concluirResolver = resolve; });
  }

  document.getElementById('concluirConfirmar').addEventListener('click', function () { fecharConfirmacao(true); });
  document.getElementById('concluirCancelar').addEventListener('click', function () { fecharConfirmacao(false); });
  document.getElementById('concluirClose').addEventListener('click', function () { fecharConfirmacao(false); });
  concluirOverlay.addEventListener('click', function (e) { if (e.target === concluirOverlay) fecharConfirmacao(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && concluirOverlay.classList.contains('is-open')) fecharConfirmacao(false);
  });

  carregar();
});
