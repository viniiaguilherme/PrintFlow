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
const emailUsuario = "vinii.aguilherme@gmail.com";

/* =========================================================================
   TOASTS (notificações rápidas no canto da tela)
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

function simularAlerta() {
  if (typeof emailjs === 'undefined') return;
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
      showToast('Falha no envio', 'Não foi possível enviar o e-mail de alerta agora.', 'error');
    });
}

document.addEventListener('DOMContentLoaded', function () {

  var toastStack = document.getElementById('toastStack');

  /* =======================================================================
     2. LOGIN
     ======================================================================= */
  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var emailInput = document.getElementById('loginEmail');
      var senhaInput = document.getElementById('loginSenha');
      var email = emailInput ? emailInput.value.trim() : '';
      var senha = senhaInput ? senhaInput.value : '';

      if (!email || !senha) {
        showToast('Atenção', 'Preencha o e-mail e a senha.', 'error');
        return;
      }

      fetch('/printflow/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, senha: senha })
      })
      .then(async function(response) {
        var data = await response.json().catch(function() { return {}; });
        if (!response.ok) {
          throw new Error(data.message || 'E-mail ou senha incorretos.');
        }
        return data;
      })
      .then(function(data) {
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('usuarioId', data.id);
        }
        showToast('Sucesso', 'Login realizado com sucesso!', 'success');
        setTimeout(function () {
          window.location.href = '/dashboard';
        }, 1000);
      })
      .catch(function(error) {
        showToast('Erro no Login', error.message, 'error');
      });
    });
  }

  /* =======================================================================
     3. CADASTRO DE USUÁRIO
     ======================================================================= */
  var cadastroForm = document.getElementById('cadastroForm');
  if (cadastroForm) {
    cadastroForm.addEventListener('submit', function (event) {
      event.preventDefault();

      var nome = document.getElementById('cadastroNome').value.trim();
      var email = document.getElementById('cadastroEmail').value.trim();
      var cargo = document.getElementById('cadastroCargo') ? document.getElementById('cadastroCargo').value.trim() : 'OPERADOR';
      var senha = document.getElementById('cadastroSenha').value;
      var confirmarSenha = document.getElementById('cadastroConfirmarSenha').value;

      if (!nome || !email || !senha) {
        showToast('Atenção', 'Preencha todos os campos obrigatórios.', 'error');
        return;
      }

      if (senha !== confirmarSenha) {
        showToast('Erro', 'As senhas não coincidem!', 'error');
        return;
      }

      var role = 'OPERADOR';
      if (cargo === 'ADMINISTRADOR' || cargo === 'administrador') role = 'ADMINISTRADOR';
      if (cargo === 'MAKER' || cargo === 'maker') role = 'MAKER';
      if (cargo === 'OPERADOR' || cargo === 'operador') role = 'OPERADOR';

      var dados = { nome: nome, email: email, role: role, senha: senha };

      fetch('/printflow/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      })
      .then(async function(response) {
        if (!response.ok) {
          var resData = await response.json().catch(function() { return {}; });
          throw new Error(resData.message || 'E-mail já cadastrado ou dados inválidos.');
        }
        return true;
      })
      .then(function() {
        showToast('Sucesso', 'Usuário cadastrado com sucesso!', 'success');
        setTimeout(function () {
          window.location.href = '/login';
        }, 1200);
      })
      .catch(function(error) {
        showToast('Erro no cadastro', error.message, 'error');
      });
    });
  }

  /* =======================================================================
     3.1. CADASTRO DE IMPRESSORA
     ======================================================================= */
  var formImpressora = document.getElementById('formImpressora');
  if (formImpressora) {
    formImpressora.addEventListener('submit', function (event) {
      event.preventDefault();

      var nome = document.getElementById('novaImpressoraNome').value.trim();
      var modelo = document.getElementById('novaImpressoraModelo').value.trim();
      var material = document.getElementById('novaImpressoraMaterial').value.trim();

      if (!nome) {
        showToast('Atenção', 'Informe o nome da impressora.', 'error');
        return;
      }

      var dados = {
        nome: nome,
        modelo: modelo,
        material_padrao: material,
        status: 'Disponível'
      };

      fetch('/impressora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      })
      .then(async function (response) {
        const resData = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(resData.mensagem || resData.error || 'Erro ao cadastrar impressora.');
        }
        return resData;
      })
      .then(function (res) {
        showToast('Sucesso', 'Impressora cadastrada com sucesso.', 'success');
        formImpressora.reset();
      })
      .catch(function (err) {
        console.error(err);
        showToast('Erro', err.message || 'Não foi possível conectar ao servidor.', 'error');
      });
    });
  }

  /* =======================================================================
     3.2. CADASTRO DE ESPAÇO
     ======================================================================= */
  var formEspaco = document.getElementById('formEspaco');
  if (formEspaco) {
    formEspaco.addEventListener('submit', function (event) {
      event.preventDefault();

      var nome = document.getElementById('novoEspacoNome').value.trim();
      var responsavelEl = document.getElementById('novoEspacoResponsavel');
      var responsavel = responsavelEl ? responsavelEl.value.trim() : '';
      var statusEl = document.getElementById('novoEspacoStatus');
      var status = statusEl ? statusEl.value.trim() : 'Ativo';

      if (!nome) {
        showToast('Atenção', 'Informe o nome do espaço.', 'error');
        return;
      }

      var dados = {
        nome: nome,
        responsavel: responsavel,
        status: status
      };

      fetch('/espaco', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      })
      .then(async function (response) {
        const resData = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(resData.mensagem || resData.error || 'Erro ao cadastrar espaço.');
        }
        return resData;
      })
      .then(function (res) {
        showToast('Sucesso', 'Espaço cadastrado com sucesso.', 'success');
        formEspaco.reset();
      })
      .catch(function (err) {
        console.error(err);
        showToast('Erro', err.message || 'Não foi possível conectar ao servidor.', 'error');
      });
    });
  }

  /* =======================================================================
     4. DROPDOWNS
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
  document.addEventListener('click', closeAllDropdowns);

  /* =======================================================================
     5. SIDEBAR MOBILE
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
     7. BOTÃO "SAIR"
     ======================================================================= */
  var logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', function () {
      localStorage.removeItem('token');
      localStorage.removeItem('usuarioId');
      window.location.href = '/';
    });
  }

  /* =======================================================================
     8. HORÁRIO DE ATUALIZAÇÃO
     ======================================================================= */
  var updatedTime = document.getElementById('updatedTime');
  if (updatedTime) {
    var now = new Date();
    var horas = String(now.getHours()).padStart(2, '0');
    var minutos = String(now.getMinutes()).padStart(2, '0');
    updatedTime.textContent = horas + ':' + minutos;
  }

});