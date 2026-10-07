/* =========================================================================
   FILA DE IMPRESSÃO (fila.html)
   - Fila geral: impressões que ainda não foram para nenhuma impressora.
   - Cards das impressoras (acima da fila): cada uma recebe uma impressão por vez.
   Tudo filtrado pelo ?espaco_id= da URL. Carregar DEPOIS de js/script.js.
   RPCs usadas: listar_impressoras, listar_impressoes, adicionar_impressao,
   enviar_para_impressora, atualizar_status_impressao, remover_impressao.
   Nova impressão: o .3mf é lido no navegador (js/leitor-3mf.js, precisa do
   JSZip) e enviado ao bucket privado "impressoes" do Supabase Storage.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', function () {
  var espacoId = new URLSearchParams(window.location.search).get('espaco_id');
  var container = document.getElementById('queueGroups');
  var slotsEl = document.getElementById('printerSlots');
  var historicoEl = document.getElementById('queueHistory');
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

  var LIMITE_ARQUIVO = 50 * 1024 * 1024; // 50 MB (limite do bucket)
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

  function fmtG(n) {
    return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' g';
  }

  // 1098 -> "18m 18s" | 4000 -> "1h 6m"
  function fmtSeg(seg) {
    var h = Math.floor(seg / 3600), m = Math.floor((seg % 3600) / 60), s = seg % 60;
    var partes = [];
    if (h) partes.push(h + 'h');
    if (m) partes.push(m + 'm');
    if (s && !h) partes.push(s + 's');
    return partes.join(' ') || '0s';
  }

  function tempoJob(j) {
    if (j.status !== 'concluido' && j.tempo_seg) return fmtSeg(j.tempo_seg);
    return fmtTempo(j.tempo_min, j.status);
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
      if (j.status === 'concluido') return btn(j, 'arquivar', 'arrow-down', 'Enviar para o histórico');
      return '';
    }
    return (j.meu && j.status === 'na-fila') ? btn(j, 'remover', 'trash-2', 'Remover', true) : '';
  }

  function subtitulo(j) {
    return [j.autor || '—', j.peso_g ? fmtG(j.peso_g) : null, j.camada_mm ? j.camada_mm + 'mm' : null]
      .filter(Boolean).join(' · ');
  }

  // Descrição e filamentos (ex.: "PLA branco: 2,89 g"), exibidos abaixo do nome
  function detalhesHtml(j) {
    var html = '';
    if (j.descricao) {
      html += '<div class="job-row__subtitle" title="' + esc(j.descricao) + '">' + esc(j.descricao) + '</div>';
    }
    var fs = Array.isArray(j.filamentos) ? j.filamentos : [];
    if (fs.length) {
      html += '<div class="job-row__subtitle job-row__filaments">' + fs.map(function (f) {
        var hex = /^#[0-9a-f]{6}$/i.test(f.cor_hex || '') ? f.cor_hex : null;
        return '<span class="fil-item">' + (hex ? '<span class="fil-dot" style="background:' + hex + ';"></span>' : '') +
          esc([f.tipo, f.nome].filter(Boolean).join(' ') + ': ' + fmtG(f.g)) + '</span>';
      }).join('') + '</div>';
    }
    return html;
  }

  /* ---------- Fila geral (impressões sem impressora) ---------- */
  function linha(j, i) {
    var b = BADGES[j.status] || BADGES['na-fila'];
    return '<div class="job-row" data-status="' + j.status + '" data-title="' + esc((j.titulo + ' ' + (j.autor || '')).toLowerCase()) + '">' +
      '<span class="job-row__handle" aria-hidden="true">' + HANDLE + '</span>' +
      '<span class="job-row__index">' + String(i + 1).padStart(2, '0') + '</span>' +
      '<span class="job-material-chip">' + esc(j.material || '—') + '</span>' +
      '<div class="job-row__info"><div class="job-row__title">' + esc(j.titulo) + '</div>' +
        '<div class="job-row__subtitle">' + esc(subtitulo(j)) + '</div>' + detalhesHtml(j) + '</div>' +
      '<span class="job-row__color">' + esc(j.cor || '—') + '</span>' +
      '<div class="job-progress"><div class="job-progress__row"><div class="progress-bar"><div class="progress-bar__fill" style="width:' + j.progresso + '%;"></div></div>' +
        '<span class="job-progress__pct">' + j.progresso + '%</span></div></div>' +
      '<span class="job-row__time">' + tempoJob(j) + '</span>' +
      '<div style="display:flex; align-items:center; gap: var(--space-3);"><span class="badge ' + b[0] + '">' + b[1] + '</span>' +
        '<div class="job-row__actions">' + acoesFila(j) + '</div></div></div>';
  }

  /* ---------- Histórico (concluídas enviadas para baixo) ---------- */
  function fmtData(iso) {
    if (!iso) return null;
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function nomeImpressora(id) {
    var imp = impressoras.find(function (i) { return i.id === id; });
    return imp ? imp.nome : null;
  }

  function linhaHistorico(j, i) {
    var quando = fmtData(j.concluido_em);
    var linha1 = [
      nomeImpressora(j.impressora_id) ? 'Impressora ' + nomeImpressora(j.impressora_id) : null,
      j.peso_g ? fmtG(j.peso_g) : null,
      j.camada_mm ? j.camada_mm + 'mm' : null,
      quando ? 'concluída em ' + quando : null
    ].filter(Boolean).join(' · ');
    var linha2 = 'Na fila: ' + (j.autor || '—') +
      ' · Enviou: ' + (j.enviado_por_nome || '—') +
      ' · Retirou: ' + (j.arquivado_por_nome || '—');
    return '<div class="job-row job-row--history" data-status="concluido" data-title="' +
      esc((j.titulo + ' ' + (j.autor || '') + ' ' + (j.enviado_por_nome || '') + ' ' + (j.arquivado_por_nome || '') + ' ' + (nomeImpressora(j.impressora_id) || '')).toLowerCase()) + '">' +
      '<span class="job-row__handle" aria-hidden="true" style="visibility:hidden;">' + HANDLE + '</span>' +
      '<span class="job-row__index">' + String(i + 1).padStart(2, '0') + '</span>' +
      '<span class="job-material-chip">' + esc(j.material || '—') + '</span>' +
      '<div class="job-row__info"><div class="job-row__title">' + esc(j.titulo) + '</div>' +
        '<div class="job-row__subtitle" title="' + esc(linha1) + '">' + esc(linha1) + '</div>' +
        '<div class="job-row__subtitle" title="' + esc(linha2) + '">' + esc(linha2) + '</div></div>' +
      '<span class="job-row__color">' + esc(j.cor || '—') + '</span>' +
      '<div class="job-progress"><div class="job-progress__row"><div class="progress-bar"><div class="progress-bar__fill" style="width:100%;"></div></div>' +
        '<span class="job-progress__pct">100%</span></div></div>' +
      '<span class="job-row__time">' + fmtTempo(j.tempo_min, 'concluido') + '</span>' +
      '<div style="display:flex; align-items:center; gap: var(--space-3);"><span class="badge badge-success">Concluído</span>' +
        '<div class="job-row__actions"></div></div></div>';
  }

  /* ---------- Cards das impressoras ---------- */
  function jobDaImpressora(imp) {
    return jobs.find(function (j) { return j.impressora_id === imp.id && !j.arquivado_em; }) || null;
  }

  function slotJob(j) {
    var b = BADGES[j.status] || BADGES['na-fila'];
    var fill = j.status === 'erro'
      ? ' style="width:' + j.progresso + '%; background:linear-gradient(90deg, var(--color-danger), #ff8a94);"'
      : ' style="width:' + j.progresso + '%;"';
    return '<div class="slot-job" data-id="' + j.id + '">' +
      '<div class="slot-job__top"><span class="job-material-chip">' + esc(j.material || '—') + '</span>' +
        '<div class="job-row__info"><div class="job-row__title">' + esc(j.titulo) + '</div>' +
        '<div class="job-row__subtitle">' + esc(subtitulo(j)) + '</div>' + detalhesHtml(j) + '</div></div>' +
      '<div class="job-progress"><div class="job-progress__row"><div class="progress-bar"><div class="progress-bar__fill"' + fill + '></div></div>' +
        '<span class="job-progress__pct">' + j.progresso + '%</span></div></div>' +
      '<div class="slot-job__foot"><div class="slot-job__meta"><span class="badge ' + b[0] + '">' + b[1] + '</span>' +
        '<span class="job-row__time">' + tempoJob(j) + '</span></div>' +
        '<div class="job-row__actions">' + acoesImpressora(j) + '</div></div></div>';
  }

  function cardImpressora(imp) {
    var j = jobDaImpressora(imp);
    var dot = !j ? 'idle' : j.status === 'erro' ? 'danger' : j.status === 'pausado' ? 'warning' : j.status === 'na-fila' ? 'info' : '';
    return '<article class="card card-printer slot-card">' +
      '<div class="card-printer__head"><div class="card-printer__icon">' + PRINTER_ICON + '</div>' +
        '<div><h3 class="card-printer__name">' + esc(imp.nome) + '</h3>' +
        '<span class="card-printer__count"><span class="status-dot' + (dot ? ' status-dot--' + dot : '') + '" style="display:inline-block; margin-right:6px;"></span>' + (j ? (j.status === 'concluido' ? 'Concluída' : 'Ocupada') : 'Livre') + '</span></div></div>' +
      (j ? slotJob(j) : '<div class="slot-empty">Sem nenhuma impressão</div>') + '</article>';
  }

  function render() {
    var fila = jobs.filter(function (j) { return !j.impressora_id && !j.arquivado_em; });
    var historico = jobs.filter(function (j) { return !!j.arquivado_em; }).sort(function (a, b) {
      return new Date(b.concluido_em || 0) - new Date(a.concluido_em || 0);
    });
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

    // Histórico (mais recentes primeiro)
    historicoEl.innerHTML = '<div class="printer-group"><div class="printer-group__header">' +
      '<span class="status-dot status-dot--idle"></span>' +
      '<span class="printer-group__name">Histórico de impressões</span>' +
      '<span class="printer-group__meta">' + historico.length + ' concluída(s)</span></div>' +
      (historico.length ? '<div class="printer-group__rows">' + historico.map(linhaHistorico).join('') + '</div>'
                        : '<div class="printer-group__empty">Nenhuma impressão no histórico</div>') + '</div>';

    renderizarIconesLucide();
    aplicarFiltros();
  }

  function aplicarFiltros() {
    var termo = (searchInput.value || '').trim().toLowerCase();
    var rows = document.querySelectorAll('#queueGroups .job-row, #queueHistory .job-row');
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

    if (acao === 'arquivar') {
      r = await supabaseClient.rpc('arquivar_impressao', { p_impressao_id: id });
      if (r.error) { showToast('Erro', esc(r.error.message), 'error'); return; }
      showToast('Histórico', '"' + esc(nome) + '" foi para o histórico e a impressora está livre.', 'success');
      carregar();
      return;
    }

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
      if (!r.error && job && job.arquivo_path) {
        // Limpeza do arquivo (best effort: o banco só deixa apagar arquivo que não está mais em uso)
        supabaseClient.storage.from('impressoes').remove([job.arquivo_path]).catch(function () {});
      }
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

  /* ---------- Modal "Nova impressão" (arquivo .3mf + 4 filamentos) ---------- */
  var modal = document.createElement('div');
  modal.innerHTML =
    '<div class="modal-overlay" id="impressaoOverlay"><div class="modal" style="max-width: 580px;">' +
      '<div class="modal__head"><h3 class="modal__title">Nova impressão</h3>' +
      '<button class="modal__close" type="button" id="impressaoClose" aria-label="Fechar"><i data-lucide="x"></i></button></div>' +
      '<div class="modal__body"><form id="impressaoForm" autocomplete="off">' +
        '<div class="form-group"><label class="form-label" for="impTitulo">Nome da peça</label>' +
          '<input class="form-input" type="text" id="impTitulo" placeholder="Ex: Chaveiro" maxlength="80" required></div>' +
        '<div class="form-group"><label class="form-label" for="impDescricao">Descrição</label>' +
          '<textarea class="form-textarea" id="impDescricao" rows="2" maxlength="300" placeholder="Opcional"></textarea></div>' +
        '<div class="form-group"><label class="form-label" for="impArquivo">Arquivo .3mf (já fatiado no Bambu Studio)</label>' +
          '<input class="form-input" type="file" id="impArquivo" accept=".3mf">' +
          '<span class="form-hint" id="impArquivoStatus">O tempo e o filamento gasto são lidos automaticamente do arquivo.</span></div>' +
        '<div class="file-summary" id="impResumo" style="display:none;"></div>' +
        '<div class="form-group" style="margin-bottom:0;"><label class="form-label">Cor de cada filamento</label>' +
          '<div class="fil-inputs">' +
            [1, 2, 3, 4].map(function (n) {
              return '<div class="fil-inputs__col"><label class="form-hint" for="impFil' + n + '">Filamento ' + n + '</label>' +
                '<input class="form-input" type="text" id="impFil' + n + '" placeholder="-" maxlength="30"></div>';
            }).join('') +
          '</div>' +
          '<span class="form-hint">Digite a cor de cada filamento usado. Deixe em branco para nenhuma (-).</span></div>' +
      '</form></div>' +
      '<div class="modal__actions"><button type="button" class="btn btn-outline" id="impressaoCancelar">Cancelar</button>' +
        '<button type="submit" form="impressaoForm" class="btn btn-primary" id="impressaoSubmit" disabled style="opacity:.5; cursor:not-allowed;">Adicionar à fila</button></div>' +
    '</div></div>';
  document.body.appendChild(modal);
  renderizarIconesLucide();

  var overlay = document.getElementById('impressaoOverlay');
  var arquivoInput = document.getElementById('impArquivo');
  var arquivoStatus = document.getElementById('impArquivoStatus');
  var resumoEl = document.getElementById('impResumo');
  var submitBtn = document.getElementById('impressaoSubmit');
  var STATUS_PADRAO = arquivoStatus.textContent;

  var arquivoLido = null;        // dados extraídos do .3mf
  var arquivoSelecionado = null; // o File em si
  var enviando = false;

  function filInput(n) { return document.getElementById('impFil' + n); }

  function atualizarSubmit() {
    var ok = !!arquivoLido && !enviando;
    submitBtn.disabled = !ok;
    submitBtn.style.opacity = ok ? '' : '.5';
    submitBtn.style.cursor = ok ? '' : 'not-allowed';
  }

  // Mostra o que foi lido do arquivo; os nomes de cor digitados entram ao vivo
  function atualizarResumo() {
    if (!arquivoLido) { resumoEl.style.display = 'none'; resumoEl.innerHTML = ''; return; }

    var linhas = arquivoLido.filamentos.map(function (f) {
      var cor = filInput(f.slot).value.trim();
      var nome = [f.tipo, cor].filter(Boolean).join(' ');
      return '<div class="file-summary__fil"><span class="fil-dot" style="background:' + (f.hex || 'transparent') + ';"></span>' +
        '<span class="file-summary__slot">Filamento ' + f.slot + '</span>' + esc(nome) + ': <strong>' + fmtG(f.g) + '</strong></div>';
    }).join('');

    resumoEl.innerHTML =
      '<div class="file-summary__row"><span>Tempo de impressão</span><strong>' + fmtSeg(arquivoLido.tempoSeg) + '</strong></div>' +
      '<div class="file-summary__row"><span>Filamento total</span><strong>' + fmtG(arquivoLido.pesoG) + '</strong></div>' +
      '<div class="file-summary__fils">' + linhas + '</div>';
    resumoEl.style.display = '';
  }

  function limparArquivo() {
    arquivoLido = null;
    arquivoSelecionado = null;
    arquivoStatus.textContent = STATUS_PADRAO;
    arquivoStatus.style.color = '';
    atualizarResumo();
    atualizarSubmit();
  }

  arquivoInput.addEventListener('change', function () {
    limparArquivo();
    var file = arquivoInput.files && arquivoInput.files[0];
    if (!file) return;

    if (!/\.3mf$/i.test(file.name)) {
      arquivoStatus.textContent = 'Envie um arquivo .3mf.';
      arquivoStatus.style.color = 'var(--color-danger)';
      arquivoInput.value = '';
      return;
    }
    if (file.size > LIMITE_ARQUIVO) {
      arquivoStatus.textContent = 'Arquivo grande demais. O limite é 50 MB.';
      arquivoStatus.style.color = 'var(--color-danger)';
      arquivoInput.value = '';
      return;
    }

    arquivoStatus.textContent = 'Lendo arquivo...';
    lerArquivo3mf(file).then(function (dados) {
      if (arquivoInput.files[0] !== file) return; // o usuário trocou de arquivo no meio
      arquivoLido = dados;
      arquivoSelecionado = file;
      arquivoStatus.textContent = file.name;
      arquivoStatus.style.color = '';
      atualizarResumo();
      atualizarSubmit();
    }).catch(function (erro) {
      arquivoStatus.textContent = erro.message;
      arquivoStatus.style.color = 'var(--color-danger)';
      arquivoInput.value = '';
    });
  });

  [1, 2, 3, 4].forEach(function (n) { filInput(n).addEventListener('input', atualizarResumo); });

  function abrirModal() {
    overlay.classList.add('is-open');
    document.getElementById('impTitulo').focus();
  }
  function fecharModal() {
    if (enviando) return;
    overlay.classList.remove('is-open');
    document.getElementById('impressaoForm').reset();
    limparArquivo();
  }

  novaBtn.addEventListener('click', abrirModal);
  document.getElementById('impressaoClose').addEventListener('click', fecharModal);
  document.getElementById('impressaoCancelar').addEventListener('click', fecharModal);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) fecharModal(); });

  function novoNomeArquivo() {
    var id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now() + '-' + Math.random().toString(16).slice(2));
    return espacoId + '/' + id + '.3mf';
  }

  document.getElementById('impressaoForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var titulo = document.getElementById('impTitulo').value.trim();
    if (!titulo) return;
    if (!arquivoLido || !arquivoSelecionado) {
      showToast('Atenção', 'Selecione o arquivo .3mf.', 'error');
      return;
    }

    enviando = true;
    submitBtn.textContent = 'Enviando...';
    atualizarSubmit();

    var filamentos = arquivoLido.filamentos.map(function (f) {
      return { slot: f.slot, tipo: f.tipo, cor_hex: f.hex, nome: filInput(f.slot).value.trim() || null, g: f.g };
    });

    var caminho = novoNomeArquivo();
    var bucket = supabaseClient.storage.from('impressoes');
    var up = await bucket.upload(caminho, arquivoSelecionado, { contentType: 'application/octet-stream', upsert: false });

    if (up.error) {
      showToast('Erro', 'Não foi possível enviar o arquivo.', 'error');
    } else {
      var r = await supabaseClient.rpc('adicionar_impressao', {
        p_espaco_id: espacoId,
        p_titulo: titulo,
        p_descricao: document.getElementById('impDescricao').value.trim() || null,
        p_arquivo_path: caminho,
        p_arquivo_nome: arquivoSelecionado.name,
        p_filamentos: filamentos,
        p_peso: arquivoLido.pesoG,
        p_camada: arquivoLido.camadaMm,
        p_tempo_seg: arquivoLido.tempoSeg
      });

      if (r.error) {
        await bucket.remove([caminho]); // não deixa arquivo órfão
        showToast('Erro', esc(r.error.message), 'error');
      } else {
        enviando = false;
        showToast('Sucesso', 'Impressão adicionada à fila!', 'success');
        fecharModal();
        carregar();
      }
    }

    enviando = false;
    submitBtn.textContent = 'Adicionar à fila';
    atualizarSubmit();
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
      'Marcar "' + nomeModelo + '" como concluída? O progresso vai para 100%. A impressora só fica livre quando você enviar a impressão para o histórico.';
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
