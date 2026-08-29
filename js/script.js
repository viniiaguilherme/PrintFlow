/* =========================================================================
   CONFIGURAÇÃO DO EMAILJS
   ========================================================================= */

if (typeof emailjs !== 'undefined') {
  emailjs.init({
    publicKey: "aiwzR_9fnFpSvjeee"
  });
}

const serviceID = "printflowkey";

const templateID = "PrintingError";

// E-MAIL DO USUÁRIO -> substituir futuramente
// o valor é fixo atualmente (meu e-mail)
// Depois q vc implementar o login, tem que fazer o get com o email do usuario
const emailUsuario = "vinii.aguilherme@gmail.com";


/* =========================================================================
   TOASTS (notificações rápidas no canto da tela)
   -------------------------------------------------------------------------
   Função global  para poder ser chamada tanto
   pelas interações internas deste arquivo quanto pela função
   simularAlerta() logo abaixo, que é acionada via onclick="" direto no
   HTML do botão "Simular Alerta".

   type: "success" (padrão, verde) ou "error" (vermelho) — troca apenas
   o ícone e a cor, mantendo o mesmo modelo visual do toast.
   ========================================================================= */
function showToast(title, message, type) {
  var toastStack = document.getElementById('toastStack');
  if (!toastStack) return;

  var isError = type === 'error';
  var iconMarkup = isError
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>';

  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML =
    '<span class="toast__icon' + (isError ? ' toast__icon--danger' : '') + '">' + iconMarkup + '</span>' +
    '<div>' +
    '<div class="toast__title">' + title + '</div>' +
    '<div class="toast__msg">' + message + '</div>' +
    '</div>' +
    '<button class="toast__close" type="button" aria-label="Fechar">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>' +
    '</button>';

  toastStack.appendChild(toast);

  // Pequeno delay para permitir a transição de entrada
  requestAnimationFrame(function () {
    toast.classList.add('is-visible');
  });

  function removeToast() {
    toast.classList.remove('is-visible');
    setTimeout(function () { toast.remove(); }, 250);
  }

  toast.querySelector('.toast__close').addEventListener('click', removeToast);
  setTimeout(removeToast, 4500);
}


/* =========================================================================
   SIMULAR ALERTA — função do botão "Simular Alerta" (dashboard.html)
   -------------------------------------------------------------------------
   Envia um e-mail de teste via EmailJS, simulando o alerta que o sistema
   enviaria de verdade caso uma impressora falhasse durante uma impressão.
   ========================================================================= */
function simularAlerta() {
  emailjs.send(
    serviceID,
    templateID,
    {
      user: "Usuário Teste",
      email: emailUsuario,
      impressao: "Peça de Teste",
      impressora: "Ender 3",
      horario: new Date().toLocaleString()
    }
  )
    .then(function () {
      showToast('Alerta enviado', 'O e-mail de teste foi enviado com sucesso para ' + emailUsuario + '.');
    })
    .catch(function (erro) {
      console.error(erro);
      showToast('Falha no envio', 'Não foi possível enviar o e-mail de alerta agora. Tente novamente em instantes.', 'error');
    });
}


document.addEventListener('DOMContentLoaded', function () {

  /* =======================================================================
     1. PILHA DE TOASTS
     A função showToast() foi movida para o escopo global (fora deste
     bloco), pois também precisa ser chamada por simularAlerta(), que é
     disparada via onclick="" diretamente no HTML.
     ======================================================================= */
  var toastStack = document.getElementById('toastStack');

  /* =======================================================================
     2. LOGIN 
     ======================================================================= */
  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();
      window.location.href = 'dashboard.html';
    });
  }

  /* =======================================================================
     3. CADASTRO
     ======================================================================= */
  var cadastroForm = document.getElementById('cadastroForm');
  if (cadastroForm) {
    cadastroForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const nome = document.getElementById('cadastroNome').value;
      const email = document.getElementById('cadastroEmail').value;
      const cargo = document.getElementById('cadastroCargo').value;
      const senha = document.getElementById('cadastroSenha').value;
      const confirmarSenha = document.getElementById('cadastroConfirmarSenha').value;

      if (!nome || !email || !cargo || !senha) {
        showToast('Atenção', 'Preencha todos os campos obrigatórios.', 'error');
        return;
      }

      if (senha !== confirmarSenha) {
        showToast('As senhas não coincidem!');
        return;
      }

      const dados = { nome, email, cargo, senha };

      fetch('usuario_cadastro.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados)
      })
        .then(resposta => {
          if (!resposta.ok) {
            alert("Não foi possível a conexão");
          }
          return resposta.text();

        })

      window.location.href = 'login.html';
    });
  }

  /* =======================================================================
     4. DROPDOWNS (avatar e notificações no topbar do dashboard)
     ======================================================================= */
  function setupDropdown(buttonId, menuId) {
    var button = document.getElementById(buttonId);
    var menu = document.getElementById(menuId);
    if (!button || !menu) return;

    button.addEventListener('click', function (event) {
      event.stopPropagation();
      var isOpen = menu.classList.contains('is-open');
      closeAllDropdowns();
      if (!isOpen) menu.classList.add('is-open');
    });
  }

  function closeAllDropdowns() {
    document.querySelectorAll('.dropdown__menu.is-open').forEach(function (menu) {
      menu.classList.remove('is-open');
    });
  }

  setupDropdown('avatarButton', 'avatarMenu');
  setupDropdown('notifButton', 'notifMenu');

  // Fecha os dropdowns ao clicar fora deles
  document.addEventListener('click', closeAllDropdowns);

  /* =======================================================================
     5. SIDEBAR MOBILE (abrir/fechar em telas menores)
     ======================================================================= */
  var sidebar = document.getElementById('sidebar');
  var sidebarBackdrop = document.getElementById('sidebarBackdrop');
  var menuToggle = document.getElementById('menuToggle');

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('is-open');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('is-open');
  }

  if (menuToggle && sidebar && sidebarBackdrop) {
    menuToggle.addEventListener('click', function (event) {
      event.stopPropagation();
      sidebar.classList.toggle('is-open');
      sidebarBackdrop.classList.toggle('is-open');
    });
    sidebarBackdrop.addEventListener('click', closeSidebar);
  }

  /* =======================================================================
     6. LINKS DA SIDEBAR AINDA NÃO IMPLEMENTADOS - AVISO DE "EM DESENVOLVIMENTO"
     ======================================================================= */
  document.querySelectorAll('[data-feature-toast]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      showToast('Em desenvolvimento', 'Esta funcionalidade estará disponível em breve.');
    });
  });

  /* =======================================================================
     7. BOTÃO "SAIR" — volta para a tela inicial
     ======================================================================= */
  var logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', function () {
      window.location.href = 'index.html';
    });
  }

  /* =======================================================================
     8. HORÁRIO DE ATUALIZAÇÃO (dashboard) — apenas decorativo
     ======================================================================= */
  var updatedTime = document.getElementById('updatedTime');
  if (updatedTime) {
    var now = new Date();
    var horas = String(now.getHours()).padStart(2, '0');
    var minutos = String(now.getMinutes()).padStart(2, '0');
    updatedTime.textContent = horas + ':' + minutos;
  }

  /* =======================================================================
     9. TOAST DE BOAS-VINDAS (dashboard) — apenas para demonstrar o
     componente de toast em uso
     ======================================================================= */
  if (toastStack && sidebar) {
    setTimeout(function () {
      showToast('Bem-vindo ao PrintFlow', 'Conecte sua primeira impressora — Gerencie seu espaço.');
    }, 600);
  }

  /* =======================================================================
     10. IMPRESSORAS — MODAIS E CARDS DINÂMICOS (impressoras.html)
     -------------------------------------------------------------------------
     Tudo aqui é 100% front-end: os cards de impressora e os filamentos são
     criados apenas na tela, na memória do navegador — nada é salvo de
     verdade ainda. Se a página for recarregada, tudo criado aqui some.

     Os blocos marcados com "TODO BACKEND" mostram exatamente onde entra a
     chamada real ao servidor (mesmo padrão de fetch() já usado no cadastro
     de usuário — ver cadastro.html / usuario_cadastro.php). Quem for
     implementar o backend real só precisa:
       1. Descomentar/adaptar o fetch() sugerido no comentário;
       2. Fazer o endpoint PHP devolver JSON no formato { id, nome, ... };
       3. Trocar o objeto "fake" criado localmente pelo objeto que veio
          da resposta do servidor.
     A partir daí, o card passa a exibir dados reais vindos do banco.
     ======================================================================= */
  var printersGrid = document.getElementById('printersGrid');

  if (printersGrid) {

    // ---- Abrir / fechar modal (genérico para qualquer .modal-overlay) ----
    function openModal(modal) {
      if (modal) modal.classList.add('is-open');
    }
    function closeModal(modal) {
      if (modal) modal.classList.remove('is-open');
    }

    document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
      // Fecha ao clicar no fundo escurecido (fora da caixa do modal)
      overlay.addEventListener('click', function (event) {
        if (event.target === overlay) closeModal(overlay);
      });
      // Fecha em qualquer botão marcado com [data-modal-close] (X ou Cancelar)
      overlay.querySelectorAll('[data-modal-close]').forEach(function (botao) {
        botao.addEventListener('click', function () { closeModal(overlay); });
      });
    });

    // Fecha o modal aberto com a tecla Esc
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.is-open').forEach(closeModal);
      }
    });

    // ---- Contador "X impressora(s)" no cabeçalho da página ----------------
    var printerCountEl = document.getElementById('printerCount');
    function atualizarContagemImpressoras() {
      if (!printerCountEl) return;
      var total = printersGrid.querySelectorAll('.card-printer').length;
      printerCountEl.textContent = total + ' impressora(s)';
    }

    // Ícones SVG reaproveitados na criação de cards/linhas novas
    var PRINTER_ICON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="9" width="16" height="7" rx="1.5"/><path d="M7 9V6a2 2 0 012-2h6a2 2 0 012 2v3"/><path d="M7 16v2a1 1 0 001 1h8a1 1 0 001-1v-2"/></svg>';
    var PLUS_ICON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';

    // ---- Cria o <article> de uma impressora --------------------------------
    // "impressora" deve ter o formato { id, nome }.
    // O "id" é o que, no futuro, identifica a impressora no banco de dados
    // (chave estrangeira usada depois para salvar um filamento nela).
    function criarCardImpressora(impressora) {
      var article = document.createElement('article');
      article.className = 'card card-printer';
      article.dataset.printerId = impressora.id;

      article.innerHTML =
        '<div class="card-printer__head">' +
          '<div class="card-printer__icon">' + PRINTER_ICON_SVG + '</div>' +
          '<div>' +
            '<h3 class="card-printer__name"></h3>' +
            '<span class="card-printer__count">0 filamento(s)</span>' +
          '</div>' +
        '</div>' +
        '<div class="card-printer__filaments">' +
          '<span class="card-printer__filaments-label">Filamentos carregados</span>' +
        '</div>' +
        '<button type="button" class="btn btn-outline-accent btn-block card-printer__add" data-action="add-filament">' +
          PLUS_ICON_SVG + ' Adicionar filamento' +
        '</button>';

      // Nome inserido via textContent (não innerHTML), para o texto não ser
      // interpretado como HTML — importante quando o nome vier do banco.
      article.querySelector('.card-printer__name').textContent = impressora.nome;

      return article;
    }

    // ---- Adiciona uma linha de filamento a um card já existente ------------
    // "filamento" deve ter o formato { tipo, nome }.
    function adicionarFilamentoAoCard(card, filamento) {
      var lista = card.querySelector('.card-printer__filaments');

      var row = document.createElement('div');
      row.className = 'filament-row';
      row.innerHTML = '<span class="filament-tag"></span><span class="filament-name"></span>';
      row.querySelector('.filament-tag').textContent = filamento.tipo;
      row.querySelector('.filament-name').textContent = filamento.nome;
      lista.appendChild(row);

      var countEl = card.querySelector('.card-printer__count');
      var total = lista.querySelectorAll('.filament-row').length;
      countEl.textContent = total + ' filamento(s)';
    }

    // ---- MODAL: NOVA IMPRESSORA --------------------------------------------
    var modalNovaImpressora = document.getElementById('modalNovaImpressora');
    var formNovaImpressora = document.getElementById('formNovaImpressora');
    var addPrinterButton = document.getElementById('addPrinterButton');

    if (addPrinterButton && modalNovaImpressora) {
      addPrinterButton.addEventListener('click', function () {
        formNovaImpressora.reset();
        openModal(modalNovaImpressora);
        document.getElementById('novaImpressoraNome').focus();
      });
    }

    if (formNovaImpressora) {
      formNovaImpressora.addEventListener('submit', function (event) {
        event.preventDefault();

        var nomeInput = document.getElementById('novaImpressoraNome');
        var nome = nomeInput.value.trim();

        if (!nome) {
          showToast('Atenção', 'Dê um nome para a impressora antes de continuar.', 'error');
          return;
        }

        // TODO BACKEND: trocar o bloco "fake" abaixo por uma chamada real,
        // no mesmo padrão do cadastro de usuário (cadastro.html):
        //
        //   fetch('impressora_cadastro.php', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ nome: nome })
        //   })
        //     .then(function (resposta) { return resposta.json(); })
        //     .then(function (impressoraSalva) {
        //       // impressoraSalva deve vir do backend como { id, nome }
        //       printersGrid.appendChild(criarCardImpressora(impressoraSalva));
        //       atualizarContagemImpressoras();
        //       closeModal(modalNovaImpressora);
        //       showToast('Impressora adicionada', '"' + impressoraSalva.nome + '" foi adicionada à sua frota.');
        //     })
        //     .catch(function (erro) {
        //       console.error(erro);
        //       showToast('Erro', 'Não foi possível salvar a impressora.', 'error');
        //     });

        // Por enquanto (sem backend implementado), cria o card só na tela:
        var impressoraFake = { id: 'local-' + Date.now(), nome: nome };
        printersGrid.appendChild(criarCardImpressora(impressoraFake));
        atualizarContagemImpressoras();

        closeModal(modalNovaImpressora);
        showToast('Impressora adicionada', '"' + nome + '" foi adicionada à sua frota.');
      });
    }

    // ---- MODAL: NOVO FILAMENTO ----------------------------------------------
    var modalNovoFilamento = document.getElementById('modalNovoFilamento');
    var formNovoFilamento = document.getElementById('formNovoFilamento');

    // Guarda qual card pediu o filamento (preenchido ao abrir o modal, lido
    // de volta no submit). Usa delegação de evento no grid, então funciona
    // tanto nos cards já existentes no HTML quanto nos criados dinamicamente.
    var filamentoCardAlvo = null;

    printersGrid.addEventListener('click', function (event) {
      var botao = event.target.closest('[data-action="add-filament"]');
      if (!botao || !modalNovoFilamento) return;

      filamentoCardAlvo = botao.closest('.card-printer');
      formNovoFilamento.reset();
      openModal(modalNovoFilamento);
      document.getElementById('novoFilamentoTipo').focus();
    });

    if (formNovoFilamento) {
      formNovoFilamento.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!filamentoCardAlvo) return;

        var tipo = document.getElementById('novoFilamentoTipo').value.trim();
        var nomeFilamento = document.getElementById('novoFilamentoNome').value.trim();

        if (!tipo || !nomeFilamento) {
          showToast('Atenção', 'Selecione o material e informe a cor/nome do filamento.', 'error');
          return;
        }

        // TODO BACKEND: o ID da impressora já está disponível em
        // filamentoCardAlvo.dataset.printerId — é ele que deve ser enviado
        // junto para o servidor saber em qual impressora salvar o filamento:
        //
        //   fetch('filamento_cadastro.php', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //       impressora_id: filamentoCardAlvo.dataset.printerId,
        //       tipo: tipo,
        //       nome: nomeFilamento
        //     })
        //   })
        //     .then(function (resposta) { return resposta.json(); })
        //     .then(function (filamentoSalvo) {
        //       // filamentoSalvo deve vir do backend como { tipo, nome }
        //       adicionarFilamentoAoCard(filamentoCardAlvo, filamentoSalvo);
        //       closeModal(modalNovoFilamento);
        //       showToast('Filamento adicionado', '"' + filamentoSalvo.nome + '" foi adicionado à impressora.');
        //     })
        //     .catch(function (erro) {
        //       console.error(erro);
        //       showToast('Erro', 'Não foi possível salvar o filamento.', 'error');
        //     });

        // Por enquanto (sem backend implementado), adiciona a linha só na tela:
        adicionarFilamentoAoCard(filamentoCardAlvo, { tipo: tipo.toUpperCase(), nome: nomeFilamento });

        closeModal(modalNovoFilamento);
        showToast('Filamento adicionado', '"' + nomeFilamento + '" foi adicionado à impressora.');

        filamentoCardAlvo = null;
      });
    }

    // Sincroniza o contador do cabeçalho com os cards já presentes no HTML
    atualizarContagemImpressoras();
  }

});
