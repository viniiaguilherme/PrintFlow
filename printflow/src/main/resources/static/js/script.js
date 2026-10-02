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
   GERENCIAMENTO DE AUTENTICAÇÃO (TOKEN & SESSÃO)
   ========================================================================= */
const STORAGE_TOKEN_KEY = 'printflow_token';
const STORAGE_USER_KEY = 'printflow_user';

function getToken() {
  return localStorage.getItem(STORAGE_TOKEN_KEY);
}

function setAuthSession(token, user) {
  if (token) localStorage.setItem(STORAGE_TOKEN_KEY, token);
  if (user) localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
}

function clearAuthSession() {
  localStorage.removeItem(STORAGE_TOKEN_KEY);
  localStorage.removeItem(STORAGE_USER_KEY);
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

// Helper para requisições autenticadas à API
async function fetchWithAuth(url, options = {}) {
  const token = getToken();
  const headers = options.headers || {};

  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  options.headers = headers;

  const response = await fetch(url, options);

  if (response.status === 401 || response.status === 403) {
    if (response.status === 401) {
      clearAuthSession();
      const isPublic = isPublicPath(window.location.pathname);
      if (!isPublic) {
        window.location.href = 'login.html';
      }
    } else if (response.status === 403) {
      showToast('Acesso Negado', 'Você não tem permissão para realizar esta ação.', 'error');
    }
  }

  return response;
}

function isPublicPath(pathname) {
  const path = (pathname || '').toLowerCase();
  return path === '/' ||
    path.endsWith('/index') || path.endsWith('/index.html') ||
    path.endsWith('/login') || path.endsWith('/login.html') ||
    path.endsWith('/cadastro') || path.endsWith('/cadastro.html');
}

/* =========================================================================
   VERIFICAÇÃO DE AUTENTICAÇÃO E PERMISSÕES EM CADA PÁGINA
   ========================================================================= */
function checkRolePermissions(user, currentPath) {
  if (!user) return true;
  const role = (user.perfil || user.cargo || user.role || '').toUpperCase();
  const path = currentPath.toLowerCase();

  const isMaker = role === 'MAKER';
  const isOperador = role === 'OPERADOR';
  const isAdmin = role === 'ADMINISTRADOR' || role === 'ADMIN';

  // 1. Telas exclusivas do ADMINISTRADOR: /usuarios, /configuracoes
  if (path.endsWith('/usuarios.html') || path.endsWith('/usuarios') ||
    path.endsWith('/configuracoes.html') || path.endsWith('/configuracoes')) {
    if (!isAdmin) {
      showToast('Acesso Restrito', 'Esta página é de acesso exclusivo para Administradores.', 'error');
      setTimeout(function () {
        window.location.href = isMaker ? 'espacos.html' : 'dashboard.html';
      }, 1000);
      return false;
    }
  }

  // 2. Telas do OPERADOR e ADMINISTRADOR: /dashboard, /impressoras
  if (path.endsWith('/impressoras.html') || path.endsWith('/impressoras') ||
    path.endsWith('/dashboard.html') || path.endsWith('/dashboard')) {
    if (isMaker) {
      showToast('Acesso Restrito', 'Perfil Maker tem acesso apenas aos Espaços e à Fila de Impressão.', 'error');
      setTimeout(function () {
        window.location.href = 'espacos.html';
      }, 1000);
      return false;
    }
  }

  return true;
}

function adaptSidebarForRole(user) {
  if (!user) return;
  const role = (user.perfil || user.cargo || user.role || '').toUpperCase();
  const isMaker = role === 'MAKER';
  const isOperador = role === 'OPERADOR';

  document.querySelectorAll('.sidebar__nav a').forEach(function (link) {
    const href = (link.getAttribute('href') || '').toLowerCase();

    if (isMaker) {
      if (href.includes('dashboard') || href.includes('impressoras') || href.includes('usuarios') || href.includes('configuracoes')) {
        link.style.display = 'none';
      }
    } else if (isOperador) {
      if (href.includes('usuarios') || href.includes('configuracoes')) {
        link.style.display = 'none';
      }
    }
  });
}

async function checkPageAuthentication() {
  const currentPath = window.location.pathname.toLowerCase();
  const isPublic = isPublicPath(currentPath);
  const token = getToken();

  if (!isPublic) {
    // Páginas protegidas: exigem token válido
    if (!token) {
      window.location.href = 'login.html';
      return;
    }

    try {
      const response = await fetch('/printflow/auth/me', {
        headers: { 'Authorization': 'Bearer ' + token }
      });

      if (!response.ok) {
        clearAuthSession();
        window.location.href = 'login.html';
        return;
      }

      const user = await response.json();
      setAuthSession(token, user);

      const allowed = checkRolePermissions(user, currentPath);
      if (allowed) {
        updateUserUI(user);
        adaptSidebarForRole(user);
      }
    } catch (err) {
      console.error('Erro ao verificar autenticação:', err);
      const savedUser = getStoredUser();
      if (savedUser) {
        const allowed = checkRolePermissions(savedUser, currentPath);
        if (allowed) {
          updateUserUI(savedUser);
          adaptSidebarForRole(savedUser);
        }
      }
    }
  } else if (currentPath.endsWith('/login') || currentPath.endsWith('/login.html') || currentPath.endsWith('/cadastro') || currentPath.endsWith('/cadastro.html')) {
    // Páginas de login e cadastro: se já estiver logado com token válido, redireciona para a tela de espaços
    if (token) {
      try {
        const response = await fetch('/printflow/auth/me', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (response.ok) {
          window.location.href = 'espacos.html';
        }
      } catch (err) {
        // ignora erro
      }
    }
  }
}

function updateUserUI(user) {
  if (!user) return;
  const initials = getInitials(user.nome || user.email || 'U');
  document.querySelectorAll('.avatar').forEach(el => {
    el.textContent = initials;
    el.title = (user.nome || user.email) + (user.cargo || user.perfil ? ' (' + (user.cargo || user.perfil) + ')' : '');
  });
}

function getInitials(name) {
  if (!name) return 'PF';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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

/* =========================================================================
   SIMULAR ALERTA (EmailJS)
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

  // Executa verificação de autenticação e permissões na página atual
  checkPageAuthentication();

  /* =======================================================================
     1. LOGIN
     ======================================================================= */
  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const email = document.getElementById('loginEmail').value.trim();
      const senha = document.getElementById('loginSenha').value;

      if (!email || !senha) {
        showToast('Atenção', 'Informe e-mail e senha.', 'error');
        return;
      }

      fetch('/printflow/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      })
        .then(async response => {
          const resData = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(resData.mensagem || resData.error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
          }
          return resData;
        })
        .then(data => {
          setAuthSession(data.token, data);
          showToast('Sucesso', 'Login realizado com sucesso!', 'success');
          setTimeout(function () {
            window.location.href = 'espacos.html';
          }, 600);
        })
        .catch(error => {
          showToast('Erro no login', error.message, 'error');
        });
    });
  }

  /* =======================================================================
     2. CADASTRO DE USUÁRIO
     ======================================================================= */
  var cadastroForm = document.getElementById('cadastroForm');
  if (cadastroForm) {
    cadastroForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const nome = document.getElementById('cadastroNome').value.trim();
      const email = document.getElementById('cadastroEmail').value.trim();
      const cargo = document.getElementById('cadastroCargo').value.trim();
      const senha = document.getElementById('cadastroSenha').value;
      const confirmarSenha = document.getElementById('cadastroConfirmarSenha').value;

      if (!nome || !email || !cargo || !senha) {
        showToast('Atenção', 'Preencha todos os campos obrigatórios.', 'error');
        return;
      }

      if (senha !== confirmarSenha) {
        showToast('Erro', 'As senhas não coincidem!', 'error');
        return;
      }

      const dados = { nome, email, role: cargo, senha };

      fetch('/printflow/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados)
      })
        .then(async response => {
          if (!response.ok) {
            const resData = await response.json().catch(() => ({}));
            throw new Error(resData.mensagem || resData.error || 'Não foi possível concluir o cadastro (E-mail pode já estar em uso).');
          }
          return response;
        })
        .then(() => {
          showToast('Sucesso', 'Usuário cadastrado com sucesso!', 'success');
          setTimeout(function () {
            window.location.href = 'login.html';
          }, 1500);
        })
        .catch(error => {
          showToast('Erro no cadastro', error.message, 'error');
        });
    });
  }

  /* =======================================================================
     MODAIS (Abertura e Fechamento)
     ======================================================================= */
  function setupModal(triggerBtnId, modalOverlayId, closeBtnId, cancelBtnId) {
    var triggerBtn = document.getElementById(triggerBtnId);
    var modalOverlay = document.getElementById(modalOverlayId);
    var closeBtn = document.getElementById(closeBtnId);
    var cancelBtn = document.getElementById(cancelBtnId);

    if (!triggerBtn || !modalOverlay) return;

    function openModal() {
      modalOverlay.classList.add('is-open');
    }

    function closeModal() {
      modalOverlay.classList.remove('is-open');
    }

    triggerBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeModal();
    });
  }

  setupModal('btnAbrirModalEspaco', 'modalEspaco', 'btnFecharModalEspaco', 'btnCancelarModalEspaco');
  setupModal('btnAbrirModalIngressar', 'modalIngressar', 'btnFecharModalIngressar', 'btnCancelarModalIngressar');
  setupModal('btnAbrirModalImpressora', 'modalImpressora', 'btnFecharModalImpressora', 'btnCancelarModalImpressora');

  /* =======================================================================
     3. CADASTRO DE IMPRESSORA
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

      fetchWithAuth('/impressora', {
        method: 'POST',
        body: JSON.stringify(dados)
      })
        .then(async function (response) {
          const resData = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(resData.mensagem || resData.error || 'Erro ao cadastrar impressora.');
          }
          return resData;
        })
        .then(function (resData) {
          showToast('Sucesso', 'Impressora "' + nome + '" cadastrada com sucesso.', 'success');
          formImpressora.reset();

          var modal = document.getElementById('modalImpressora');
          if (modal) modal.classList.remove('is-open');

          var printersGrid = document.getElementById('printersGrid');
          if (printersGrid) {
            var article = document.createElement('article');
            article.className = 'card card-printer';
            article.innerHTML =
              '<div class="card-printer__head">' +
                '<div class="card-printer__icon">' +
                  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="9" width="16" height="7" rx="1.5"/><path d="M7 9V6a2 2 0 012-2h6a2 2 0 012 2v3"/><path d="M7 16v2a1 1 0 001 1h8a1 1 0 001-1v-2"/></svg>' +
                '</div>' +
                '<div>' +
                  '<h3 class="card-printer__name">' + (resData.nome || nome) + '</h3>' +
                  '<span class="card-printer__count">' + (modelo || 'FDM') + '</span>' +
                '</div>' +
              '</div>' +
              '<div class="card-printer__filaments">' +
                '<span class="card-printer__filaments-label">Filamentos carregados</span>' +
                '<div class="filament-row">' +
                  '<span class="filament-tag">' + (material || 'PLA') + '</span>' +
                  '<span class="filament-name">Padrão</span>' +
                '</div>' +
              '</div>' +
              '<button type="button" class="btn btn-outline-accent btn-block card-printer__add" data-feature-toast>' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
                'Adicionar filamento' +
              '</button>';
            printersGrid.appendChild(article);
          }
        })
        .catch(function (err) {
          showToast('Erro', err.message || 'Não foi possível conectar ao servidor.', 'error');
        });
    });
  }

  /* =======================================================================
     4. CADASTRO DE ESPAÇO
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

      fetchWithAuth('/espaco', {
        method: 'POST',
        body: JSON.stringify(dados)
      })
        .then(async function (response) {
          const resData = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(resData.mensagem || resData.error || 'Erro ao cadastrar espaço.');
          }
          return resData;
        })
        .then(function (resData) {
          showToast('Sucesso', 'Espaço "' + nome + '" cadastrado com sucesso.', 'success');
          formEspaco.reset();

          var modal = document.getElementById('modalEspaco');
          if (modal) modal.classList.remove('is-open');

          var spacesGrid = document.getElementById('spacesGrid');
          if (spacesGrid) {
            var article = document.createElement('article');
            article.className = 'card card-hover card-space';
            var code = Math.random().toString(36).substring(2, 8).toUpperCase();
            article.innerHTML =
              '<div class="card-feature__icon">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17l8-4 8 4-8 4-8-4z"/><path d="M4 12l8-4 8 4"/><path d="M4 7l8-4 8 4"/></svg>' +
              '</div>' +
              '<h3 class="card-space__title">' + (resData.nome || nome) + '</h3>' +
              '<p class="card-space__desc">Responsável: ' + (resData.responsavel || responsavel || 'Usuário') + '</p>' +
              '<div class="card-space__meta">' +
                '<span class="card-space__role"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg> Dono</span>' +
                '<span class="card-space__code"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg> ' + code + '</span>' +
              '</div>' +
              '<a href="dashboard.html" class="btn btn-primary btn-block card-space__cta">Abrir console <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></a>';
            spacesGrid.appendChild(article);
          }
        })
        .catch(function (err) {
          showToast('Erro', err.message || 'Não foi possível conectar ao servidor.', 'error');
        });
    });
  }

  /* =======================================================================
     4.1 INGRESSAR EM ESPAÇO
     ======================================================================= */
  var formIngressarEspaco = document.getElementById('formIngressarEspaco');
  if (formIngressarEspaco) {
    formIngressarEspaco.addEventListener('submit', function (event) {
      event.preventDefault();

      var codigo = document.getElementById('codigoEspaco').value.trim();
      if (!codigo) {
        showToast('Atenção', 'Informe o código do espaço.', 'error');
        return;
      }

      showToast('Sucesso', 'Você ingressou no espaço ' + codigo + ' com sucesso!', 'success');
      formIngressarEspaco.reset();

      var modal = document.getElementById('modalIngressar');
      if (modal) modal.classList.remove('is-open');

      var spacesGrid = document.getElementById('spacesGrid');
      if (spacesGrid) {
        var article = document.createElement('article');
        article.className = 'card card-hover card-space';
        article.innerHTML =
          '<div class="card-feature__icon">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17l8-4 8 4-8 4-8-4z"/><path d="M4 12l8-4 8 4"/><path d="M4 7l8-4 8 4"/></svg>' +
          '</div>' +
          '<h3 class="card-space__title">Espaço ' + codigo.toUpperCase() + '</h3>' +
          '<p class="card-space__desc">Espaço ingressado via código</p>' +
          '<div class="card-space__meta">' +
            '<span class="card-space__role"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg> Membro</span>' +
            '<span class="card-space__code"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg> ' + codigo.toUpperCase() + '</span>' +
          '</div>' +
          '<a href="dashboard.html" class="btn btn-primary btn-block card-space__cta">Abrir console <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></a>';
        spacesGrid.appendChild(article);
      }
    });
  }

  /* =======================================================================
     5. DROPDOWNS (avatar e notificações no topbar)
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
     6. SIDEBAR MOBILE
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
     7. AVISO DE "EM DESENVOLVIMENTO"
     ======================================================================= */
  document.querySelectorAll('[data-feature-toast]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      showToast('Em desenvolvimento', 'Esta funcionalidade estará disponível em breve.');
    });
  });

  /* =======================================================================
     8. BOTÃO "SAIR" (LOGOUT)
     ======================================================================= */
  var logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', function () {
      fetchWithAuth('/printflow/auth/logout', { method: 'POST' })
        .finally(() => {
          clearAuthSession();
          window.location.href = 'login.html';
        });
    });
  }

  /* =======================================================================
     9. HORÁRIO DE ATUALIZAÇÃO (dashboard)
     ======================================================================= */
  var updatedTime = document.getElementById('updatedTime');
  if (updatedTime) {
    var now = new Date();
    var horas = String(now.getHours()).padStart(2, '0');
    var minutos = String(now.getMinutes()).padStart(2, '0');
    updatedTime.textContent = horas + ':' + minutos;
  }

  /* =======================================================================
     10. BUSCA DE ESTATÍSTICAS (página inicial)
     ======================================================================= */
  if (document.getElementById("espacos") && document.getElementById("impressoes")) {
    fetch("/api/estatisticas/geral")
      .then(response => response.json())
      .then(dados => {
        if (document.getElementById("espacos")) document.getElementById("espacos").textContent = dados.espacos;
        if (document.getElementById("impressoras")) document.getElementById("impressoras").textContent = dados.impressoras_cadastradas;
        if (document.getElementById("usuarios")) document.getElementById("usuarios").textContent = dados.usuarios_cadastrados;
        if (document.getElementById("impressoes")) document.getElementById("impressoes").textContent = dados.impressoes_totais;
      })
      .catch(erro => {
        console.error("Erro ao buscar estatísticas gerais:", erro);
      });
  }

  /* =======================================================================
     11. BUSCA DE ESTATÍSTICAS (dashboard)
     ======================================================================= */
  if (document.getElementById("estatisticaImpressoras")) {
    fetchWithAuth(`/api/estatisticas/espaco/1`)
      .then(response => response.json())
      .then(dados => {
        if (dados.erro) return;
        if (document.getElementById("estatisticaImpressoras")) document.getElementById("estatisticaImpressoras").textContent = dados.impressoras;
        if (document.getElementById("estatisticaFilas")) document.getElementById("estatisticaFilas").textContent = dados.filas;
        if (document.getElementById("estatisticaAlertas")) document.getElementById("estatisticaAlertas").textContent = dados.alertas;
        if (document.getElementById("estatisticaUsuarios")) document.getElementById("estatisticaUsuarios").textContent = dados.usuarios;
      })
      .catch(erro => {
        console.error("Erro ao buscar estatísticas do espaço:", erro);
      });
  }

  /* =======================================================================
     12. BUSCA DE ESTATÍSTICAS (usuários)
     ======================================================================= */
  if (document.getElementById("estatisticaMembros")) {
    fetchWithAuth("/api/estatisticas/usuarios")
      .then(response => response.json())
      .then(dados => {
        if (dados.error) return;
        if (document.getElementById("estatisticaMembros")) document.getElementById("estatisticaMembros").textContent = dados.total_membros;
        if (document.getElementById("estatisticaAtivos")) document.getElementById("estatisticaAtivos").textContent = dados.ativos_agora;
        if (document.getElementById("estatisticaImpressoesUsuarios")) document.getElementById("estatisticaImpressoesUsuarios").textContent = dados.total_impressoes;
        if (document.getElementById("estatisticaFilamentoUsuarios")) document.getElementById("estatisticaFilamentoUsuarios").textContent = dados.filamento_usado_kg + " kg";
      })
      .catch(erro => {
        console.error("Erro ao buscar estatísticas de usuários:", erro);
      });
  }

});