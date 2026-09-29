/* =========================================================================
   IMPRESSORAS (impressoras.html)
   Tudo é filtrado pelo ?espaco_id= da URL, então cada espaço tem suas
   próprias impressoras e filamentos. Carregar DEPOIS de js/script.js.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', function () {
  var espacoId = new URLSearchParams(window.location.search).get('espaco_id');
  var grid = document.getElementById('printersGrid');
  var resumo = document.getElementById('impressorasResumo');
  var addBtn = document.getElementById('addImpressoraBtn');

  if (!espacoId) {
    showToast('Atenção', 'Nenhum espaço selecionado. Escolha um em "Meus espaços".', 'error');
    setTimeout(function () { window.location.href = 'espacos.html'; }, 1500);
    return;
  }

  var TIPOS = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'Nylon', 'Outro'];
  var impressoraAlvoId = null; // impressora que vai receber o filamento

  function escapeHtml(t) {
    var d = document.createElement('div');
    d.textContent = t == null ? '' : String(t);
    return d.innerHTML;
  }

  /* ---------- Modais (injetados aqui pra não poluir o HTML) ---------- */
  var modais = document.createElement('div');
  modais.innerHTML =
    '<div class="modal-overlay" id="impressoraOverlay"><div class="modal">' +
      '<div class="modal__head"><h3 class="modal__title">Adicionar impressora</h3>' +
      '<button class="modal__close" type="button" data-fechar="impressoraOverlay" aria-label="Fechar"><i data-lucide="x"></i></button></div>' +
      '<div class="modal__body"><form id="impressoraForm">' +
        '<div class="form-group" style="margin-bottom:0;">' +
          '<label class="form-label" for="impressoraNome">Nome da impressora</label>' +
          '<input class="form-input" type="text" id="impressoraNome" placeholder="Ex: Bambu-X1" maxlength="60" required>' +
        '</div></form></div>' +
      '<div class="modal__actions">' +
        '<button type="button" class="btn btn-outline" data-fechar="impressoraOverlay">Cancelar</button>' +
        '<button type="submit" form="impressoraForm" class="btn btn-primary">Adicionar</button>' +
      '</div></div></div>' +

    '<div class="modal-overlay" id="filamentoOverlay"><div class="modal">' +
      '<div class="modal__head"><h3 class="modal__title" id="filamentoTitulo">Adicionar filamento</h3>' +
      '<button class="modal__close" type="button" data-fechar="filamentoOverlay" aria-label="Fechar"><i data-lucide="x"></i></button></div>' +
      '<div class="modal__body"><form id="filamentoForm">' +
        '<div class="form-group"><label class="form-label" for="filamentoTipo">Tipo</label>' +
          '<select class="form-select" id="filamentoTipo">' +
            TIPOS.map(function (t) { return '<option>' + t + '</option>'; }).join('') +
          '</select></div>' +
        '<div class="form-group" style="margin-bottom:0;">' +
          '<label class="form-label" for="filamentoNome">Nome / cor</label>' +
          '<input class="form-input" type="text" id="filamentoNome" placeholder="Ex: Branco, Carbon" maxlength="40" required>' +
        '</div></form></div>' +
      '<div class="modal__actions">' +
        '<button type="button" class="btn btn-outline" data-fechar="filamentoOverlay">Cancelar</button>' +
        '<button type="submit" form="filamentoForm" class="btn btn-primary">Adicionar</button>' +
      '</div></div></div>';
  document.body.appendChild(modais);
  renderizarIconesLucide();

  function abrir(id) {
    var el = document.getElementById(id);
    el.classList.add('is-open');
    var input = el.querySelector('input');
    if (input) input.focus();
  }

  function fechar(id) {
    var el = document.getElementById(id);
    el.classList.remove('is-open');
    el.querySelector('form').reset();
  }

  document.querySelectorAll('[data-fechar]').forEach(function (b) {
    b.addEventListener('click', function () { fechar(b.getAttribute('data-fechar')); });
  });
  ['impressoraOverlay', 'filamentoOverlay'].forEach(function (id) {
    var el = document.getElementById(id);
    el.addEventListener('click', function (e) { if (e.target === el) fechar(id); });
  });

  /* ---------- Renderização ---------- */
  function criarCard(imp) {
    var art = document.createElement('article');
    art.className = 'card card-printer';

    var filamentos = imp.filamentos || [];
    var listaHtml = filamentos.length
      ? filamentos.map(function (f) {
          return '<div class="filament-row"><span class="filament-tag">' + escapeHtml(f.tipo) +
                 '</span><span class="filament-name">' + escapeHtml(f.nome) + '</span>' +
                 '<button type="button" class="btn-icon btn-icon--sm btn-icon--danger remover-filamento-btn" ' +
                 'data-id="' + Number(f.id) + '" data-nome="' + escapeHtml(f.tipo + ' ' + f.nome).replace(/"/g, '&quot;') + '" ' +
                 'aria-label="Remover filamento" style="margin-left:auto;"><i data-lucide="trash-2"></i></button></div>';
        }).join('')
      : '<span class="form-hint">Nenhum filamento carregado.</span>';

    art.innerHTML =
      '<div class="card-printer__head">' +
        '<div class="card-printer__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="9" width="16" height="7" rx="1.5"/><path d="M7 9V6a2 2 0 012-2h6a2 2 0 012 2v3"/><path d="M7 16v2a1 1 0 001 1h8a1 1 0 001-1v-2"/></svg></div>' +
        '<div><h3 class="card-printer__name">' + escapeHtml(imp.nome) + '</h3>' +
        '<span class="card-printer__count">' + filamentos.length + ' filamento(s)</span></div>' +
        '<button type="button" class="btn-icon btn-icon--danger remover-impressora-btn" aria-label="Remover impressora" style="margin-left:auto;">' +
          '<i data-lucide="trash-2"></i></button>' +
      '</div>' +
      '<div class="card-printer__filaments">' +
        '<span class="card-printer__filaments-label">Filamentos carregados</span>' + listaHtml +
      '</div>' +
      '<button type="button" class="btn btn-outline-accent btn-block card-printer__add add-filamento-btn">' +
        '<i data-lucide="plus"></i>Adicionar filamento</button>';

    var btn = art.querySelector('.add-filamento-btn');
    btn.impressoraId = imp.id;
    btn.impressoraNome = imp.nome;

    var remover = art.querySelector('.remover-impressora-btn');
    remover.impressoraId = imp.id;
    remover.impressoraNome = imp.nome;
    remover.qtdFilamentos = filamentos.length;
    return art;
  }

  function carregar() {
    supabaseClient.rpc('listar_impressoras', { p_espaco_id: espacoId }).then(function (r) {
      if (r.error) {
        showToast('Erro', 'Não foi possível carregar as impressoras.', 'error');
        return;
      }
      var lista = r.data || [];
      grid.innerHTML = '';
      resumo.textContent = lista.length + ' impressora(s) · gerencie filamentos disponíveis.';

      if (lista.length === 0) {
        grid.innerHTML = '<p class="text-muted" style="grid-column:1/-1; text-align:center; padding: var(--space-8) 0;">Este espaço ainda não tem impressoras. Adicione a primeira.</p>';
        return;
      }
      lista.forEach(function (imp) { grid.appendChild(criarCard(imp)); });
      renderizarIconesLucide();
    });
  }

  carregar();

  /* ---------- Ações ---------- */
  addBtn.addEventListener('click', function () { abrir('impressoraOverlay'); });

  grid.addEventListener('click', function (e) {
    var btn = e.target.closest('.add-filamento-btn');
    if (!btn) return;
    impressoraAlvoId = btn.impressoraId;
    document.getElementById('filamentoTitulo').textContent = 'Adicionar filamento — ' + btn.impressoraNome;
    abrir('filamentoOverlay');
  });

  // Remover impressora (apaga também todos os filamentos dela)
  grid.addEventListener('click', async function (e) {
    var btn = e.target.closest('.remover-impressora-btn');
    if (!btn) return;

    var aviso = 'Remover a impressora "' + btn.impressoraNome + '"?';
    if (btn.qtdFilamentos > 0) {
      aviso += ' Os ' + btn.qtdFilamentos + ' filamento(s) dela também serão apagados.';
    }
    if (!window.confirm(aviso)) return;

    var r = await supabaseClient.rpc('remover_impressora', { p_impressora_id: btn.impressoraId });
    if (r.error) {
      showToast('Erro', r.error.message, 'error');
      return;
    }
    showToast('Impressora removida', '"' + escapeHtml(btn.impressoraNome) + '" foi removida do espaço.');
    carregar();
  });

  // Remover um filamento individual
  grid.addEventListener('click', async function (e) {
    var btn = e.target.closest('.remover-filamento-btn');
    if (!btn) return;

    var nome = btn.getAttribute('data-nome');
    if (!window.confirm('Remover o filamento "' + nome + '"?')) return;

    var r = await supabaseClient.rpc('remover_filamento', { p_filamento_id: Number(btn.getAttribute('data-id')) });
    if (r.error) {
      showToast('Erro', r.error.message, 'error');
      return;
    }
    showToast('Filamento removido', '"' + escapeHtml(nome) + '" foi removido.');
    carregar();
  });

  document.getElementById('impressoraForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var nome = document.getElementById('impressoraNome').value.trim();
    if (!nome) return;

    var r = await supabaseClient.rpc('adicionar_impressora', { p_espaco_id: espacoId, p_nome: nome });
    if (r.error) {
      showToast('Erro', r.error.message, 'error');
      return;
    }
    showToast('Sucesso', 'Impressora "' + escapeHtml(nome) + '" adicionada!', 'success');
    fechar('impressoraOverlay');
    carregar();
  });

  document.getElementById('filamentoForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var tipo = document.getElementById('filamentoTipo').value;
    var nome = document.getElementById('filamentoNome').value.trim();
    if (!nome || !impressoraAlvoId) return;

    var r = await supabaseClient.rpc('adicionar_filamento', {
      p_impressora_id: impressoraAlvoId,
      p_tipo: tipo,
      p_nome: nome
    });
    if (r.error) {
      showToast('Erro', r.error.message, 'error');
      return;
    }
    showToast('Sucesso', 'Filamento adicionado!', 'success');
    fechar('filamentoOverlay');
    carregar();
  });
});
