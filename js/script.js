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

});
