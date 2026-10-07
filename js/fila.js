/* =========================================================================
   FILA DE IMPRESSÃO (fila.html)
   Uma única fila geral por espaço (?espaco_id= da URL), com a impressora
   indicada em cada linha. Carregar DEPOIS de js/script.js.
   RPCs usadas: listar_impressoras, listar_impressoes, adicionar_impressao,
   atualizar_status_impressao, remover_impressao.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', function () {
  var espacoId = new URLSearchParams(window.location.search).get('espaco_id');
  var container = document.getElementById('queueGroups');
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
  var permissoesProntas = obterPermissoes().then(function (d) {
    ehGestor = !!d && (d.cargo === 'Dono' || d.cargo === 'Operador');
  });

  var BADGES = {
    'imprimindo': ['badge-success', 'Imprimindo'],
    'na-fila': ['badge-info', 'Na fila'],
    'pausado': ['badge-neutral', 'Pausado'],
    'erro': ['badge-danger', 'Erro'],
    'concluido': ['badge-success', 'Concluído']
  };
  var HANDLE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>';

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

  function acoes(j) {
    var btn = function (acao, icone, label, perigo) {
      return '<button type="button" class="btn-icon btn-icon--sm' + (perigo ? ' btn-icon--danger' : '') +
        '" data-acao="' + acao + '" data-id="' + j.id + '" aria-label="' + label + '"><i data-lucide="' + icone + '"></i></button>';
    };
    if (ehGestor) {
      if (j.status === 'imprimindo') return btn('pausado', 'pause', 'Pausar') + btn('concluido', 'check', 'Concluir') + btn('erro', 'alert-triangle', 'Marcar erro', true);
      if (j.status === 'na-fila') return btn('imprimindo', 'play', 'Iniciar') + btn('remover', 'trash-2', 'Remover', true);
      if (j.status === 'pausado') return btn('imprimindo', 'play', 'Retomar') + btn('remover', 'x', 'Cancelar', true);
      if (j.status === 'erro') return btn('na-fila', 'refresh-cw', 'Reenviar') + btn('remover', 'trash-2', 'Remover', true);
      return btn('remover', 'trash-2', 'Remover', true);
    }
    // Maker: só remove a própria impressão que ainda está na fila
    return (j.meu && j.status === 'na-fila') ? btn('remover', 'trash-2', 'Remover', true) : '';
  }

  function nomeImpressora(id) {
    var imp = impressoras.find(function (i) { return i.id === id; });
    return imp ? imp.nome : null;
  }

  function linha(j, i) {
    var b = BADGES[j.status] || BADGES['na-fila'];
    var sub = [j.autor || '—', nomeImpressora(j.impressora_id), j.peso_g ? j.peso_g + 'g' : null, j.camada_mm ? j.camada_mm + 'mm' : null]
      .filter(Boolean).join(' · ');
    var fill = j.status === 'erro'
      ? ' style="width:' + j.progresso + '%; background:linear-gradient(90deg, var(--color-danger), #ff8a94);"'
      : ' style="width:' + j.progresso + '%;"';
    return '<div class="job-row" data-status="' + j.status + '" data-title="' + esc((j.titulo + ' ' + (j.autor || '') + ' ' + (nomeImpressora(j.impressora_id) || '')).toLowerCase()) + '">' +
      '<span class="job-row__handle" aria-hidden="true">' + HANDLE + '</span>' +
      '<span class="job-row__index">' + String(i + 1).padStart(2, '0') + '</span>' +
      '<span class="job-material-chip">' + esc(j.material || '—') + '</span>' +
      '<div class="job-row__info"><div class="job-row__title">' + esc(j.titulo) + '</div>' +
        '<div class="job-row__subtitle">' + esc(sub) + '</div></div>' +
      '<span class="job-row__color">' + esc(j.cor || '—') + '</span>' +
      '<div class="job-progress"><div class="job-progress__row"><div class="progress-bar"><div class="progress-bar__fill"' + fill + '></div></div>' +
        '<span class="job-progress__pct">' + j.progresso + '%</span></div></div>' +
      '<span class="job-row__time">' + fmtTempo(j.tempo_min, j.status) + '</span>' +
      '<div style="display:flex; align-items:center; gap: var(--space-3);"><span class="badge ' + b[0] + '">' + b[1] + '</span>' +
        '<div class="job-row__actions">' + acoes(j) + '</div></div></div>';
  }

  function render(jobs) {
    var ativos = jobs.filter(function (j) { return j.status !== 'concluido'; }).length;
    var imprimindo = jobs.filter(function (j) { return j.status === 'imprimindo'; }).length;
    resumo.textContent = jobs.length + ' trabalho(s) · ' + ativos + ' na fila · ' + imprimindo + ' imprimindo agora';

    if (!impressoras.length) {
      container.innerHTML = '<p class="text-muted" style="text-align:center; padding: var(--space-8) 0;">Este espaço ainda não tem impressoras. Cadastre uma em "Impressoras" para criar a fila.</p>';
      return;
    }

    // Fila única: pendentes/em andamento primeiro (ordem de criação), concluídas no fim
    var ordenados = jobs.slice().sort(function (a, b) {
      var ca = a.status === 'concluido', cb = b.status === 'concluido';
      if (ca !== cb) return ca ? 1 : -1;
      return a.id - b.id;
    });

    var estado = jobs.some(function (j) { return j.status === 'erro'; }) ? 'danger'
      : jobs.some(function (j) { return j.status === 'imprimindo'; }) ? ''
      : jobs.some(function (j) { return j.status === 'pausado'; }) ? 'warning' : 'idle';

    container.innerHTML = '<div class="printer-group"><div class="printer-group__header">' +
      '<span class="status-dot' + (estado ? ' status-dot--' + estado : '') + '"></span>' +
      '<span class="printer-group__name">Fila geral</span>' +
      '<span class="printer-group__meta">' + ativos + ' na fila · ' + imprimindo + ' imprimindo</span></div>' +
      (ordenados.length ? '<div class="printer-group__rows">' + ordenados.map(linha).join('') + '</div>'
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
    Promise.all([
      permissoesProntas,
      supabaseClient.rpc('listar_impressoras', { p_espaco_id: espacoId }),
      supabaseClient.rpc('listar_impressoes', { p_espaco_id: espacoId })
    ]).then(function (r) {
      if (r[1].error || r[2].error) {
        showToast('Erro', 'Não foi possível carregar a fila.', 'error');
        return;
      }
      impressoras = r[1].data || [];
      render(r[2].data || []);
    });
  }

  searchInput.addEventListener('input', aplicarFiltros);

  /* ---------- Ações nas linhas (delegado: as linhas são recriadas) ---------- */
  container.addEventListener('click', async function (e) {
    var b = e.target.closest('[data-acao]');
    if (!b) return;
    var id = Number(b.getAttribute('data-id'));
    var acao = b.getAttribute('data-acao');
    var r;
    if (acao === 'concluido') {
      var linhaEl = b.closest('.job-row');
      var nomeModelo = linhaEl ? linhaEl.querySelector('.job-row__title').textContent : 'esta impressão';
      var ok = await confirmarConclusao(nomeModelo);
      if (!ok) return;
    }
    if (acao === 'remover') {
      if (!window.confirm('Remover esta impressão da fila?')) return;
      r = await supabaseClient.rpc('remover_impressao', { p_impressao_id: id });
    } else {
      r = await supabaseClient.rpc('atualizar_status_impressao', { p_impressao_id: id, p_status: acao });
    }
    if (r.error) { showToast('Erro', esc(r.error.message), 'error'); return; }
    carregar();
  });

  /* ---------- Modal "Nova impressão" ---------- */
  var modal = document.createElement('div');
  modal.innerHTML =
    '<div class="modal-overlay" id="impressaoOverlay"><div class="modal">' +
      '<div class="modal__head"><h3 class="modal__title">Nova impressão</h3>' +
      '<button class="modal__close" type="button" id="impressaoClose" aria-label="Fechar"><i data-lucide="x"></i></button></div>' +
      '<div class="modal__body"><form id="impressaoForm">' +
        '<div class="form-group"><label class="form-label" for="impTitulo">Modelo</label>' +
          '<input class="form-input" type="text" id="impTitulo" placeholder="Ex: Suporte de câmera" maxlength="80" required></div>' +
        '<div class="form-group"><label class="form-label" for="impImpressora">Impressora</label>' +
          '<select class="form-select" id="impImpressora" required></select></div>' +
        '<div class="form-group"><label class="form-label" for="impFilamento">Filamento</label>' +
          '<select class="form-select" id="impFilamento"></select></div>' +
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
  var selImp = document.getElementById('impImpressora');
  var selFil = document.getElementById('impFilamento');

  function preencherFilamentos() {
    var imp = impressoras.find(function (i) { return String(i.id) === selImp.value; });
    var fils = (imp && imp.filamentos) || [];
    selFil.innerHTML = '<option value="">Sem filamento definido</option>' + fils.map(function (f, i) {
      return '<option value="' + i + '">' + esc(f.tipo + ' — ' + f.nome) + '</option>';
    }).join('');
  }
  selImp.addEventListener('change', preencherFilamentos);

  function abrirModal() {
    if (!impressoras.length) {
      showToast('Atenção', 'Cadastre uma impressora antes de criar uma impressão.', 'error');
      return;
    }
    selImp.innerHTML = impressoras.map(function (i) {
      return '<option value="' + i.id + '">' + esc(i.nome) + '</option>';
    }).join('');
    preencherFilamentos();
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

    var imp = impressoras.find(function (i) { return String(i.id) === selImp.value; });
    var fil = selFil.value !== '' && imp ? imp.filamentos[Number(selFil.value)] : null;
    var peso = document.getElementById('impPeso').value;
    var tempo = (Number(document.getElementById('impHoras').value) || 0) * 60 +
                (Number(document.getElementById('impMinutos').value) || 0);

    var r = await supabaseClient.rpc('adicionar_impressao', {
      p_espaco_id: espacoId,
      p_impressora_id: imp.id,
      p_titulo: titulo,
      p_material: fil ? fil.tipo : null,
      p_cor: fil ? fil.nome : null,
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
      'Marcar "' + nomeModelo + '" como concluída? O progresso vai para 100%.';
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
