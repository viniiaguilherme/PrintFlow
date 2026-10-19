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
const emailUsuario = "[EMAIL_ADDRESS]";

/* =========================================================================
   GERENCIAMENTO DE AUTENTICAÇÃO (TOKEN & SESSÃO)
   ========================================================================= */
const STORAGE_TOKEN_KEY = 'printflow_token';
const STORAGE_USER_KEY = 'printflow_user';
const STORAGE_JOINED_SPACE_KEY = 'printflow_active_space';

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
  clearJoinedSpace();
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function getJoinedSpace() {
  try {
    const raw = localStorage.getItem(STORAGE_JOINED_SPACE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setJoinedSpace(space) {
  if (space) {
    localStorage.setItem(STORAGE_JOINED_SPACE_KEY, JSON.stringify(space));
  }
}

function clearJoinedSpace() {
  localStorage.removeItem(STORAGE_JOINED_SPACE_KEY);
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

  // Administradores têm acesso completo e irrestrito
  if (isAdmin) return true;

  // Telas públicas ou livres para todos os autenticados
  if (path.endsWith('/espacos.html') || path.endsWith('/espacos') ||
      path.endsWith('/perfil.html') || path.endsWith('/perfil')) {
    return true;
  }

  // Verifica se o usuário ingressou em um espaço
  const joinedSpace = getJoinedSpace();
  const hasIngressado = !!joinedSpace;

  // QUANDO O MAKER E OPERADOR INGRESSAR: A restrição deve ser anulada!
  if (hasIngressado) {
    // Telas do console do espaço liberadas para Maker e Operador que ingressaram no espaço
    if (path.endsWith('/dashboard.html') || path.endsWith('/dashboard') ||
        path.endsWith('/impressoras.html') || path.endsWith('/impressoras') ||
        path.endsWith('/fila.html') || path.endsWith('/fila') ||
        path.endsWith('/alerta.html') || path.endsWith('/alerta') ||
        path.endsWith('/historico.html') || path.endsWith('/historico')) {
      return true;
    }

    // Telas de usuários e configurações do espaço: liberadas para Operador após ingressar
    if (path.endsWith('/usuarios.html') || path.endsWith('/usuarios') ||
        path.endsWith('/configuracoes.html') || path.endsWith('/configuracoes')) {
      if (isOperador) {
        return true;
      }
      showToast('Acesso Restrito', 'Esta página é restrita aos Administradores e Operadores do espaço.', 'error');
      setTimeout(function () {
        window.location.href = 'dashboard.html';
      }, 1000);
      return false;
    }

    return true;
  }

  // Caso AINDA NÃO TENHA INGRESSADO em um espaço:
  showToast('Ingresso Necessário', 'Para acessar o console, ingresse em um espaço utilizando o código de acesso.', 'error');
  setTimeout(function () {
    window.location.href = 'espacos.html';
  }, 1000);
  return false;
}

function adaptSidebarForRole(user) {
  if (!user) return;
  const role = (user.perfil || user.cargo || user.role || '').toUpperCase();
  const isMaker = role === 'MAKER';
  const isOperador = role === 'OPERADOR';
  const isAdmin = role === 'ADMINISTRADOR' || role === 'ADMIN';

  const joinedSpace = getJoinedSpace();
  const hasIngressado = !!joinedSpace;

  document.querySelectorAll('.sidebar__nav a').forEach(function (link) {
    const href = (link.getAttribute('href') || '').toLowerCase();

    if (isAdmin) {
      link.style.display = '';
      return;
    }

    if (hasIngressado) {
      // Quando o Maker e Operador ingressar, a restrição é anulada!
      if (isMaker) {
        // Maker que ingressou tem acesso liberado ao Painel, Fila, Impressoras e Alertas
        if (href.includes('usuarios') || href.includes('configuracoes')) {
          link.style.display = 'none';
        } else {
          link.style.display = '';
        }
      } else if (isOperador) {
        // Operador que ingressou tem acesso liberado ao console do espaço
        link.style.display = '';
      }
    } else {
      // Sem ter ingressado em um espaço:
      if (isMaker) {
        if (href.includes('dashboard') || href.includes('impressoras') || href.includes('usuarios') || href.includes('configuracoes')) {
          link.style.display = 'none';
        }
      } else if (isOperador) {
        if (href.includes('usuarios') || href.includes('configuracoes')) {
          link.style.display = 'none';
        }
      }
    }
  });

  document.querySelectorAll('.mobile-bottom-nav a').forEach(function (item) {
    const href = (item.getAttribute('href') || '').toLowerCase();
    if (isAdmin) {
      item.style.display = '';
      return;
    }
    if (hasIngressado) {
      item.style.display = '';
    } else {
      if (isMaker) {
        if (href.includes('dashboard') || href.includes('impressoras')) {
          item.style.display = 'none';
        }
      }
    }
  });

  // Oculta e desabilita o botão de Criar Espaço para Makers e Operadores (apenas Administradores podem criar)
  const btnCriarEspaco = document.getElementById('btnAbrirModalEspaco');
  if (btnCriarEspaco) {
    if (isMaker || isOperador || !isAdmin) {
      btnCriarEspaco.style.display = 'none';
      btnCriarEspaco.disabled = true;
    } else {
      btnCriarEspaco.style.display = '';
      btnCriarEspaco.disabled = false;
    }
  }

  // Exibe indicação do espaço ativo no rodapé da sidebar, se disponível
  if (hasIngressado && joinedSpace) {
    const sidebarStatus = document.querySelector('.sidebar__status');
    const existingBadge = document.getElementById('sidebarActiveSpace');
    if (existingBadge) {
      existingBadge.innerHTML = '<span style="display:inline-block; width:6px; height:6px; border-radius:50%; background-color: var(--primary);"></span> Espaço: <strong>' + (joinedSpace.codigo || joinedSpace.nome || 'Ativo') + '</strong>';
    } else if (sidebarStatus) {
      const spaceBadge = document.createElement('div');
      spaceBadge.id = 'sidebarActiveSpace';
      spaceBadge.style.cssText = 'font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; display: flex; align-items: center; gap: 4px;';
      spaceBadge.innerHTML = '<span style="display:inline-block; width:6px; height:6px; border-radius:50%; background-color: var(--primary);"></span> Espaço: <strong>' + (joinedSpace.codigo || joinedSpace.nome || 'Ativo') + '</strong>';
      sidebarStatus.parentNode.insertBefore(spaceBadge, sidebarStatus.nextSibling);
    }
  }
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

  const sessionName = document.getElementById('userSessionName');
  if (sessionName) {
    if (user.username) {
      sessionName.textContent = user.username;
    } else if (user.nome) {
      sessionName.textContent = user.nome.toLowerCase().replace(/\s+/g, '.');
    } else if (user.email) {
      sessionName.textContent = user.email.split('@')[0];
    } else {
      sessionName.textContent = 'm.santos';
    }
  }

  const avatarMenu = document.getElementById('avatarMenu');
  if (avatarMenu && !document.getElementById('linkMeusEspacosMenu')) {
    const linkEspacos = document.createElement('a');
    linkEspacos.id = 'linkMeusEspacosMenu';
    linkEspacos.href = 'espacos.html';
    linkEspacos.className = 'dropdown__item';
    linkEspacos.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">' +
        '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>' +
      '</svg> Meus espaços';

    const divider = avatarMenu.querySelector('.dropdown__divider');
    if (divider) {
      avatarMenu.insertBefore(linkEspacos, divider);
    } else {
      avatarMenu.appendChild(linkEspacos);
    }
  }
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

  // Adapta a interface imediatamente com o usuário salvo na sessão (localStorage)
  const savedUser = getStoredUser();
  if (savedUser) {
    updateUserUI(savedUser);
    adaptSidebarForRole(savedUser);
  }

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
    var triggerBtn = triggerBtnId ? document.getElementById(triggerBtnId) : null;
    var modalOverlay = document.getElementById(modalOverlayId);
    var closeBtn = closeBtnId ? document.getElementById(closeBtnId) : null;
    var cancelBtn = cancelBtnId ? document.getElementById(cancelBtnId) : null;

    if (!modalOverlay) return;

    function openModal() {
      modalOverlay.classList.add('is-open');
    }

    function closeModal() {
      modalOverlay.classList.remove('is-open');
    }

    if (triggerBtn) triggerBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeModal();
    });
  }

  setupModal('btnAbrirModalEspaco', 'modalEspaco', 'btnFecharModalEspaco', 'btnCancelarModalEspaco');
  setupModal('btnAbrirModalIngressar', 'modalIngressar', 'btnFecharModalIngressar', 'btnCancelarModalIngressar');
  setupModal('btnAbrirModalImpressora', 'modalImpressora', 'btnFecharModalImpressora', 'btnCancelarModalImpressora');
  setupModal('btnAbrirModalUsuario', 'modalConvidarUsuario', 'btnFecharModalUsuario', 'btnCancelarModalUsuario');
  setupModal(null, 'modalEditarUsuario', 'btnFecharModalEditarUsuario', 'btnCancelarModalEditarUsuario');
  setupModal(null, 'modalFilamento', 'btnFecharModalFilamento', 'btnCancelarModalFilamento');
  setupModal('btnAbrirModalImpressao', 'modalNovaImpressao', 'btnFecharModalImpressao', 'btnCancelarModalImpressao');
  setupModal(null, 'modalDetalhesJob', 'btnFecharModalDetalhes', 'btnFecharDetalhes');

  /* =======================================================================
     3. CADASTRO DE IMPRESSORA E FILAMENTOS
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
              '<button type="button" class="btn btn-outline-accent btn-block card-printer__add btn-adicionar-filamento">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
                'Adicionar filamento' +
              '</button>';
            printersGrid.appendChild(article);
            vincularBotoesAdicionarFilamento();
          }
        })
        .catch(function (err) {
          showToast('Erro', err.message || 'Não foi possível conectar ao servidor.', 'error');
        });
    });
  }

  // Adicionar filamento às impressoras
  var formAdicionarFilamento = document.getElementById('formAdicionarFilamento');
  var modalFilamento = document.getElementById('modalFilamento');
  var cardImpressoraAtiva = null;

  function vincularBotoesAdicionarFilamento() {
    document.querySelectorAll('.card-printer__add, .btn-adicionar-filamento').forEach(function (btn) {
      btn.onclick = function (e) {
        e.preventDefault();
        var card = btn.closest('.card-printer');
        cardImpressoraAtiva = card;
        var nome = 'Impressora';
        if (card) {
          var nameEl = card.querySelector('.card-printer__name');
          if (nameEl) nome = nameEl.textContent.trim();
        }
        var alvoInput = document.getElementById('filamentoImpressoraAlvo');
        if (alvoInput) alvoInput.value = nome;
        if (modalFilamento) modalFilamento.classList.add('is-open');
      };
    });
  }
  vincularBotoesAdicionarFilamento();

  if (formAdicionarFilamento) {
    formAdicionarFilamento.addEventListener('submit', function (e) {
      e.preventDefault();
      var tipo = document.getElementById('filamentoTipo').value;
      var cor = document.getElementById('filamentoCor').value.trim();
      var qtd = document.getElementById('filamentoQuantidade').value;

      if (!cor) {
        showToast('Atenção', 'Informe a cor do filamento.', 'error');
        return;
      }

      if (cardImpressoraAtiva) {
        var filamentsContainer = cardImpressoraAtiva.querySelector('.card-printer__filaments');
        if (filamentsContainer) {
          var row = document.createElement('div');
          row.className = 'filament-row';
          row.innerHTML =
            '<span class="filament-tag">' + tipo + '</span>' +
            '<span class="filament-name">' + cor + ' (' + qtd.split(' ')[0] + ')</span>';
          filamentsContainer.appendChild(row);

          var countEl = cardImpressoraAtiva.querySelector('.card-printer__count');
          if (countEl) {
            var total = cardImpressoraAtiva.querySelectorAll('.filament-row').length;
            countEl.textContent = total + ' filamento(s)';
          }
        }
      }

      showToast('Sucesso', 'Filamento ' + tipo + ' (' + cor + ') carregado com sucesso!', 'success');
      formAdicionarFilamento.reset();
      if (modalFilamento) modalFilamento.classList.remove('is-open');
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
     4.1 INGRESSAR EM ESPAÇO (E ANULAÇÃO DA RESTRIÇÃO PARA MAKER E OPERADOR)
     ======================================================================= */
  var formIngressarEspaco = document.getElementById('formIngressarEspaco');
  if (formIngressarEspaco) {
    formIngressarEspaco.addEventListener('submit', function (event) {
      event.preventDefault();

      var codigoInput = document.getElementById('codigoEspaco');
      var codigo = codigoInput ? codigoInput.value.trim() : '';
      if (!codigo) {
        showToast('Atenção', 'Informe o código do espaço.', 'error');
        return;
      }

      var codigoUpper = codigo.toUpperCase();

      // Busca na API /espaco se existe o espaço cadastrado com esse código ou ID
      fetchWithAuth('/espaco')
        .then(function (res) {
          if (res.ok) return res.json();
          return [];
        })
        .catch(function () { return []; })
        .then(function (lista) {
          var encontrado = Array.isArray(lista)
            ? lista.find(function (e) {
                return (e.codigo && e.codigo.trim().toUpperCase() === codigoUpper) ||
                       (e.id && String(e.id) === codigo);
              })
            : null;

          var spaceInfo = {
            id: encontrado ? encontrado.id : null,
            codigo: codigoUpper,
            nome: encontrado ? encontrado.nome : ('Espaço ' + codigoUpper),
            responsavel: encontrado ? encontrado.responsavel : 'Membro',
            role: 'Membro',
            ingressadoEm: new Date().toISOString()
          };

          // Salva o espaço ativo: A RESTRIÇÃO É ANULADA!
          setJoinedSpace(spaceInfo);

          showToast('Sucesso', 'Você ingressou no ' + spaceInfo.nome + '! Restrição anulada e acesso ao console liberado.', 'success');
          formIngressarEspaco.reset();

          var modal = document.getElementById('modalIngressar');
          if (modal) modal.classList.remove('is-open');

          // Atualiza a sidebar imediatamente com o acesso liberado
          var currentUser = getStoredUser();
          if (currentUser) {
            adaptSidebarForRole(currentUser);
          }

          // Atualiza os cards no grid de espaços
          atualizarCardsEspacosIngressados();

          // Se não havia o card no grid, adiciona-o
          var spacesGrid = document.getElementById('spacesGrid');
          var existingCard = null;
          document.querySelectorAll('.card-space').forEach(function (card) {
            var codeEl = card.querySelector('.card-space__code');
            if (codeEl && codeEl.textContent.toUpperCase().includes(codigoUpper)) {
              existingCard = card;
            }
          });

          if (!existingCard && spacesGrid) {
            var article = document.createElement('article');
            article.className = 'card card-hover card-space';
            article.innerHTML =
              '<div class="card-feature__icon">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17l8-4 8 4-8 4-8-4z"/><path d="M4 12l8-4 8 4"/><path d="M4 7l8-4 8 4"/></svg>' +
              '</div>' +
              '<h3 class="card-space__title">' + spaceInfo.nome + '</h3>' +
              '<p class="card-space__desc">Espaço ingressado via código</p>' +
              '<div class="card-space__meta">' +
                '<span class="card-space__role" style="color: var(--primary);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Ingressado (Membro)</span>' +
                '<span class="card-space__code"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg> ' + spaceInfo.codigo + '</span>' +
              '</div>' +
              '<a href="dashboard.html" class="btn btn-primary btn-block card-space__cta">Abrir console <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg></a>';
            spacesGrid.appendChild(article);
          }

          // Redireciona para o console após confirmação
          setTimeout(function () {
            window.location.href = 'dashboard.html';
          }, 1200);
        });
    });
  }

  // Atualiza visualmente o card do espaço ativo já ingressado
  function atualizarCardsEspacosIngressados() {
    var currentJoined = getJoinedSpace();
    if (!currentJoined || !currentJoined.codigo) return;

    document.querySelectorAll('.card-space').forEach(function (card) {
      var codeEl = card.querySelector('.card-space__code');
      if (codeEl && codeEl.textContent.toUpperCase().includes(currentJoined.codigo.toUpperCase())) {
        var roleEl = card.querySelector('.card-space__role');
        if (roleEl) {
          roleEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Ingressado (Membro)';
          roleEl.style.color = 'var(--primary)';
        }
      }
    });
  }

  atualizarCardsEspacosIngressados();

  // Ao clicar em "Abrir console" em espacos.html: se o Maker/Operador ainda não ingressou via código, abre o modal
  document.addEventListener('click', function (e) {
    var cta = e.target.closest('.card-space__cta');
    if (!cta) return;

    var currentUser = getStoredUser();
    if (!currentUser) return;
    var role = (currentUser.perfil || currentUser.cargo || currentUser.role || '').toUpperCase();
    if (role === 'ADMINISTRADOR' || role === 'ADMIN') return;

    var joinedSpace = getJoinedSpace();
    if (!joinedSpace) {
      e.preventDefault();
      var card = cta.closest('.card-space');
      var codeEl = card ? card.querySelector('.card-space__code') : null;
      var cardCode = codeEl ? codeEl.textContent.trim().replace(/[^a-zA-Z0-9]/g, '') : '4429AD';

      var inputCodigo = document.getElementById('codigoEspaco');
      if (inputCodigo) inputCodigo.value = cardCode;

      var modal = document.getElementById('modalIngressar');
      if (modal) modal.classList.add('is-open');

      showToast('Ingresso Necessário', 'Confirme o código ' + cardCode + ' no modal para ingressar e anular as restrições.', 'info');
      return;
    }
  });

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

  // Navegação interativa dos itens do menu do usuário (Perfil, Configurações, Meus Espaços)
  document.addEventListener('click', function (event) {
    var item = event.target.closest('#avatarMenu .dropdown__item');
    if (!item || item.id === 'logoutButton') return;

    var text = (item.textContent || '').trim().toLowerCase();
    if (text.includes('perfil')) {
      window.location.href = 'perfil.html';
    } else if (text.includes('configurações') || text.includes('configuracoes')) {
      window.location.href = 'configuracoes.html';
    } else if (text.includes('espaço') || text.includes('espaco')) {
      window.location.href = 'espacos.html';
    }
  });

  /* =======================================================================
     6. SIDEBAR MOBILE & BARRA INFERIOR MOBILE
     ======================================================================= */
  var sidebar = document.getElementById('sidebar');
  var sidebarBackdrop = document.getElementById('sidebarBackdrop');
  var menuToggle = document.getElementById('menuToggle');
  var mobileMenuBtn = document.getElementById('mobileMenuBtn');
  var sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

  function openSidebar() {
    if (sidebar) sidebar.classList.add('is-open');
    if (sidebarBackdrop) sidebarBackdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('is-open');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function toggleSidebar(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (sidebar && sidebar.classList.contains('is-open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  if (menuToggle) menuToggle.addEventListener('click', toggleSidebar);
  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleSidebar);
  if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeSidebar);
  if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeSidebar);

  document.querySelectorAll('.sidebar__link').forEach(function (link) {
    link.addEventListener('click', function () {
      if (window.innerWidth <= 900) {
        closeSidebar();
      }
    });
  });

  // Marcação ativa automática na barra de navegação inferior mobile
  function highlightMobileNav() {
    var rawPath = (window.location.pathname || '').toLowerCase();
    var page = rawPath.substring(rawPath.lastIndexOf('/') + 1) || 'index.html';

    var items = document.querySelectorAll('.mobile-bottom-nav .mobile-nav-item');
    items.forEach(function (item) {
      var navKey = item.getAttribute('data-nav');
      if (!navKey) return;
      item.classList.remove('is-active');

      if (
        (navKey === 'dashboard' && (page === 'dashboard' || page === 'dashboard.html')) ||
        (navKey === 'fila' && (page === 'fila' || page === 'fila.html')) ||
        (navKey === 'impressoras' && (page === 'impressoras' || page === 'impressoras.html')) ||
        (navKey === 'espacos' && (page === 'espacos' || page === 'espacos.html'))
      ) {
        item.classList.add('is-active');
      }
    });

    if (
      page === 'usuarios' || page === 'usuarios.html' ||
      page === 'configuracoes' || page === 'configuracoes.html' ||
      page === 'alerta' || page === 'alerta.html' ||
      page === 'perfil' || page === 'perfil.html'
    ) {
      if (mobileMenuBtn) mobileMenuBtn.classList.add('is-active');
    }
  }

  highlightMobileNav();

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
     12. BUSCA DE ESTATÍSTICAS E LISTAGEM DE USUÁRIOS
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

  /* =======================================================================
     12. USUÁRIOS (Listagem, Convidar e Editar)
     ======================================================================= */
  const userTableBody = document.querySelector('#userTable tbody');
  var formConvidarUsuario = document.getElementById('formConvidarUsuario');
  var formEditarUsuario = document.getElementById('formEditarUsuario');
  var modalEditarUsuario = document.getElementById('modalEditarUsuario');

  function vincularEventosEditarUsuario() {
    document.querySelectorAll('.btn-editar-usuario').forEach(function (btn) {
      btn.onclick = function (e) {
        e.preventDefault();
        var id = btn.getAttribute('data-user-id') || '';
        var nome = btn.getAttribute('data-user-name') || '';
        var email = btn.getAttribute('data-user-email') || '';
        var role = (btn.getAttribute('data-user-role') || 'MAKER').toUpperCase();

        if (document.getElementById('editarUsuarioId')) document.getElementById('editarUsuarioId').value = id;
        if (document.getElementById('editarUsuarioNome')) document.getElementById('editarUsuarioNome').value = nome;
        if (document.getElementById('editarUsuarioEmail')) document.getElementById('editarUsuarioEmail').value = email;
        if (document.getElementById('editarUsuarioRole')) document.getElementById('editarUsuarioRole').value = role;
        if (document.getElementById('editarUsuarioSenha')) document.getElementById('editarUsuarioSenha').value = '';

        if (modalEditarUsuario) modalEditarUsuario.classList.add('is-open');
      };
    });
  }

  function carregarListaUsuarios() {
    if (!userTableBody) return;
    fetchWithAuth('/usuario')
      .then(res => res.json())
      .then(usuarios => {
        if (!Array.isArray(usuarios) || usuarios.length === 0) return;
        userTableBody.innerHTML = '';
        usuarios.forEach(u => {
          const initials = getInitials(u.nome || u.email);
          const cargo = (u.cargo || 'MAKER').toUpperCase();
          let badgeClass = 'badge-neutral';
          if (cargo === 'ADMINISTRADOR' || cargo === 'ADMIN') badgeClass = 'badge-warning';
          else if (cargo === 'OPERADOR') badgeClass = 'badge-info';

          const tr = document.createElement('tr');
          tr.dataset.name = ((u.nome || '') + ' ' + (u.email || '')).toLowerCase();
          tr.innerHTML =
            '<td>' +
              '<div style="display:flex; align-items:center; gap: var(--space-3);">' +
                '<span class="avatar avatar-sm">' + initials + '</span>' +
                '<div>' +
                  '<div style="color: var(--color-text-primary); font-weight: 500;">' + (u.nome || 'Usuário') + '</div>' +
                  '<div style="font-size: .8125rem;">' + (u.email || '') + '</div>' +
                '</div>' +
              '</div>' +
            '</td>' +
            '<td><span class="badge ' + badgeClass + '">' + cargo + '</span></td>' +
            '<td>0</td>' +
            '<td>0.0 kg</td>' +
            '<td><span class="status-inline"><span class="status-dot"></span>Ativo</span></td>' +
            '<td>' +
              '<button type="button" class="btn-icon btn-icon--sm btn-editar-usuario" data-user-id="' + u.id + '" data-user-name="' + (u.nome || '') + '" data-user-email="' + (u.email || '') + '" data-user-role="' + cargo + '" aria-label="Editar usuário">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                  '<path d="M12 20h9" />' +
                  '<path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />' +
                '</svg>' +
              '</button>' +
            '</td>';
          userTableBody.appendChild(tr);
        });
        vincularEventosEditarUsuario();
      })
      .catch(err => {
        console.error('Erro ao listar usuários:', err);
      });
  }

  if (userTableBody) {
    vincularEventosEditarUsuario();
    carregarListaUsuarios();
  }

  // Convidar Usuário Submit
  if (formConvidarUsuario) {
    formConvidarUsuario.addEventListener('submit', function (event) {
      event.preventDefault();
      var nome = document.getElementById('novoUsuarioNome').value.trim();
      var email = document.getElementById('novoUsuarioEmail').value.trim();
      var role = document.getElementById('novoUsuarioRole').value;
      var senha = document.getElementById('novoUsuarioSenha').value.trim();

      if (!nome || !email || !senha) {
        showToast('Atenção', 'Preencha todos os campos obrigatórios.', 'error');
        return;
      }

      var dados = { nome: nome, email: email, role: role, senha: senha };

      fetchWithAuth('/usuario', {
        method: 'POST',
        body: JSON.stringify(dados)
      })
      .then(async function (response) {
        const resData = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(resData.mensagem || resData.error || 'Erro ao cadastrar usuário.');
        }
        return resData;
      })
      .then(function (resData) {
        showToast('Sucesso', 'Membro "' + nome + '" cadastrado com sucesso!', 'success');
        formConvidarUsuario.reset();
        var modal = document.getElementById('modalConvidarUsuario');
        if (modal) modal.classList.remove('is-open');
        carregarListaUsuarios();
      })
      .catch(function (err) {
        showToast('Erro no cadastro', err.message || 'Não foi possível cadastrar o usuário.', 'error');
      });
    });
  }

  // Editar Usuário Submit
  if (formEditarUsuario) {
    formEditarUsuario.addEventListener('submit', function (event) {
      event.preventDefault();
      var id = document.getElementById('editarUsuarioId').value;
      var nome = document.getElementById('editarUsuarioNome').value.trim();
      var email = document.getElementById('editarUsuarioEmail').value.trim();
      var role = document.getElementById('editarUsuarioRole').value;
      var senha = document.getElementById('editarUsuarioSenha').value.trim();

      if (!nome || !email) {
        showToast('Atenção', 'Nome e e-mail são obrigatórios.', 'error');
        return;
      }

      var dados = { nome: nome, email: email, role: role, senha: senha };

      if (id) {
        fetchWithAuth('/usuario/' + id, {
          method: 'PUT',
          body: JSON.stringify(dados)
        })
        .then(async function (response) {
          const resData = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(resData.mensagem || resData.error || 'Erro ao atualizar usuário.');
          }
          return resData;
        })
        .then(function (resData) {
          showToast('Sucesso', 'Membro "' + nome + '" atualizado com sucesso!', 'success');
          if (modalEditarUsuario) modalEditarUsuario.classList.remove('is-open');
          carregarListaUsuarios();
        })
        .catch(function (err) {
          showToast('Erro ao atualizar', err.message || 'Não foi possível salvar alterações.', 'error');
        });
      } else {
        showToast('Sucesso', 'Membro "' + nome + '" atualizado!', 'success');
        if (modalEditarUsuario) modalEditarUsuario.classList.remove('is-open');
      }
    });
  }

  /* =======================================================================
     13. CONFIGURAÇÕES DO ESPAÇO (Carregar dados, Copiar Código, Alterar)
     ======================================================================= */
  var spaceForm = document.getElementById('spaceForm');
  if (spaceForm) {
    var spaceId = 1; // Espaço padrão / ativo

    // Carrega os dados reais do espaço a partir da API /espaco
    fetchWithAuth('/espaco')
      .then(res => res.json())
      .then(espacos => {
        if (Array.isArray(espacos) && espacos.length > 0) {
          var esp = espacos[0];
          spaceId = esp.id;
          if (document.getElementById('spaceNome')) document.getElementById('spaceNome').value = esp.nome || '';
          if (document.getElementById('spaceDescricao')) {
            document.getElementById('spaceDescricao').value = esp.descricao || '';
            atualizarContadorDescricao();
          }
          if (document.getElementById('spaceCodigo')) document.getElementById('spaceCodigo').value = esp.codigo || '4429AD';
        }
      })
      .catch(err => console.error('Erro ao carregar configurações do espaço:', err));

    // Contador de caracteres da descrição
    var spaceDescricao = document.getElementById('spaceDescricao');
    var spaceDescricaoCounter = document.getElementById('spaceDescricaoCounter');
    function atualizarContadorDescricao() {
      if (spaceDescricao && spaceDescricaoCounter) {
        var len = spaceDescricao.value.length;
        spaceDescricaoCounter.textContent = len + '/200';
      }
    }
    if (spaceDescricao) {
      spaceDescricao.addEventListener('input', atualizarContadorDescricao);
    }

    // Botão de copiar código de convite
    var copyCodeBtn = document.getElementById('copyCodeBtn');
    if (copyCodeBtn) {
      copyCodeBtn.addEventListener('click', function () {
        var codigoInput = document.getElementById('spaceCodigo');
        if (codigoInput && codigoInput.value) {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(codigoInput.value)
              .then(function () {
                showToast('Sucesso', 'Código do espaço (' + codigoInput.value + ') copiado para a área de transferência!', 'success');
              })
              .catch(function () {
                showToast('Sucesso', 'Código do espaço copiado!', 'success');
              });
          } else {
            codigoInput.select();
            document.execCommand('copy');
            showToast('Sucesso', 'Código do espaço copiado!', 'success');
          }
        }
      });
    }

    // Alternar visibilidade da senha do espaço
    var toggleSenhaBtn = document.getElementById('toggleSenhaBtn');
    var spaceSenhaInput = document.getElementById('spaceSenha');
    if (toggleSenhaBtn && spaceSenhaInput) {
      toggleSenhaBtn.addEventListener('click', function () {
        var isPassword = spaceSenhaInput.type === 'password';
        spaceSenhaInput.type = isPassword ? 'text' : 'password';
      });
    }

    // Salvar/Alterar configurações do Espaço (envia PUT para a API)
    spaceForm.addEventListener('submit', function (event) {
      event.preventDefault();

      var nome = document.getElementById('spaceNome').value.trim();
      var descricao = spaceDescricao ? spaceDescricao.value.trim() : '';
      var codigo = document.getElementById('spaceCodigo') ? document.getElementById('spaceCodigo').value.trim() : '4429AD';
      var senha = spaceSenhaInput ? spaceSenhaInput.value.trim() : '';

      if (!nome) {
        showToast('Atenção', 'Informe o nome do espaço.', 'error');
        return;
      }

      var dados = {
        nome: nome,
        descricao: descricao,
        codigo: codigo,
        senha: senha
      };

      fetchWithAuth('/espaco/' + spaceId, {
        method: 'PUT',
        body: JSON.stringify(dados)
      })
        .then(async function (response) {
          var resData = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(resData.mensagem || resData.error || 'Erro ao atualizar configurações do espaço.');
          }
          return resData;
        })
        .then(function (resData) {
          showToast('Sucesso', 'Configurações do espaço "' + (resData.nome || nome) + '" atualizadas com sucesso!', 'success');
          if (spaceSenhaInput) spaceSenhaInput.value = '';
        })
        .catch(function (err) {
          showToast('Erro', err.message || 'Não foi possível salvar as alterações.', 'error');
        });
    });
  }

  /* =======================================================================
     14. FILA DE IMPRESSÃO (Nova Impressão, Filtros e Ações)
     ======================================================================= */
  var formNovaImpressao = document.getElementById('formNovaImpressao');
  var modalNovaImpressao = document.getElementById('modalNovaImpressao');
  var modalDetalhesJob = document.getElementById('modalDetalhesJob');

  function atualizarResumoFila() {
    var summaryEl = document.getElementById('queueSummary');
    if (!summaryEl) return;
    var totalTrabalhos = document.querySelectorAll('.job-row').length;
    summaryEl.textContent = totalTrabalhos + ' trabalhos · cada impressora tem sua própria fila';
  }

  function vincularAcoesFila() {
    // Pausar
    document.querySelectorAll('.btn-job-pause').forEach(function (btn) {
      btn.onclick = function (e) {
        e.preventDefault();
        var row = btn.closest('.job-row');
        if (!row) return;
        row.dataset.status = 'pausado';
        var badge = row.querySelector('.badge');
        if (badge) {
          badge.className = 'badge badge-neutral';
          badge.textContent = 'Pausado';
        }
        btn.outerHTML =
          '<button type="button" class="btn-icon btn-icon--sm btn-job-resume" aria-label="Retomar">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
          '</button>';
        vincularAcoesFila();
        showToast('Pausado', 'Impressão pausada.');
      };
    });

    // Iniciar ou Retomar
    document.querySelectorAll('.btn-job-start, .btn-job-resume').forEach(function (btn) {
      btn.onclick = function (e) {
        e.preventDefault();
        var row = btn.closest('.job-row');
        if (!row) return;
        row.dataset.status = 'imprimindo';
        var badge = row.querySelector('.badge');
        if (badge) {
          badge.className = 'badge badge-success';
          badge.textContent = 'Imprimindo';
        }
        btn.outerHTML =
          '<button type="button" class="btn-icon btn-icon--sm btn-job-pause" aria-label="Pausar">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>' +
          '</button>';
        vincularAcoesFila();
        showToast('Em andamento', 'Impressão iniciada / retomada com sucesso!');
      };
    });

    // Cancelar ou Remover
    document.querySelectorAll('.btn-job-cancel, .btn-job-remove').forEach(function (btn) {
      btn.onclick = function (e) {
        e.preventDefault();
        var row = btn.closest('.job-row');
        if (!row) return;
        var group = row.closest('.printer-group');
        row.style.transition = 'opacity .25s ease, transform .25s ease';
        row.style.opacity = '0';
        row.style.transform = 'translateX(20px)';
        setTimeout(function () {
          row.remove();
          if (group) {
            var rows = group.querySelectorAll('.job-row');
            var meta = group.querySelector('.printer-group__meta');
            if (meta) meta.textContent = rows.length + ' na fila';
            if (rows.length === 0) {
              var empty = group.querySelector('.printer-group__empty');
              if (empty) empty.style.display = '';
            }
          }
          atualizarResumoFila();
        }, 250);
        showToast('Removido', 'Trabalho removido da fila.');
      };
    });

    // Reenviar (em caso de erro)
    document.querySelectorAll('.btn-job-retry').forEach(function (btn) {
      btn.onclick = function (e) {
        e.preventDefault();
        var row = btn.closest('.job-row');
        if (!row) return;
        row.dataset.status = 'na-fila';
        var badge = row.querySelector('.badge');
        if (badge) {
          badge.className = 'badge badge-info';
          badge.textContent = 'Na fila';
        }
        var progressBar = row.querySelector('.progress-bar__fill');
        if (progressBar) progressBar.style.width = '0%';
        var pct = row.querySelector('.job-progress__pct');
        if (pct) pct.textContent = '0%';
        btn.outerHTML =
          '<button type="button" class="btn-icon btn-icon--sm btn-job-start" aria-label="Iniciar">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
          '</button>';
        vincularAcoesFila();
        showToast('Reenviado', 'Trabalho reenviado para a fila de impressão.');
      };
    });

    // Ver Detalhes
    document.querySelectorAll('.btn-job-details').forEach(function (btn) {
      btn.onclick = function (e) {
        e.preventDefault();
        var row = btn.closest('.job-row');
        if (!row || !modalDetalhesJob) return;

        var titleEl = row.querySelector('.job-row__title');
        var subEl = row.querySelector('.job-row__subtitle');
        var chipEl = row.querySelector('.job-material-chip');
        var colorEl = row.querySelector('.job-row__color');
        var timeEl = row.querySelector('.job-row__time');
        var badgeEl = row.querySelector('.badge');
        var group = row.closest('.printer-group');
        var printerName = group ? (group.querySelector('.printer-group__name') ? group.querySelector('.printer-group__name').textContent : 'Impressora') : '—';

        if (document.getElementById('detalhesNome')) document.getElementById('detalhesNome').textContent = titleEl ? titleEl.textContent : '—';
        if (document.getElementById('detalhesImpressora')) document.getElementById('detalhesImpressora').textContent = printerName;
        if (document.getElementById('detalhesMaker')) document.getElementById('detalhesMaker').textContent = subEl ? subEl.textContent : '—';
        if (document.getElementById('detalhesMaterialCor')) document.getElementById('detalhesMaterialCor').textContent = (chipEl ? chipEl.textContent : '') + ' / ' + (colorEl ? colorEl.textContent : '');
        if (document.getElementById('detalhesTempo')) document.getElementById('detalhesTempo').textContent = timeEl ? timeEl.textContent : '—';
        if (document.getElementById('detalhesStatus')) document.getElementById('detalhesStatus').textContent = badgeEl ? badgeEl.textContent : '—';

        modalDetalhesJob.classList.add('is-open');
      };
    });
  }

  // Inicializa ações da fila
  vincularAcoesFila();

  // Formulário de Nova Impressão
  if (formNovaImpressao) {
    formNovaImpressao.addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = document.getElementById('jobNome').value.trim();
      var impressora = document.getElementById('jobImpressora').value;
      var maker = document.getElementById('jobMaker').value.trim() || 'Usuário';
      var material = document.getElementById('jobMaterial').value;
      var cor = document.getElementById('jobCor').value.trim() || 'Branco';
      var tempo = document.getElementById('jobTempo').value.trim() || '1h';
      var detalhes = document.getElementById('jobDetalhes').value.trim() || '40g · 0.2mm';

      if (!nome) {
        showToast('Atenção', 'Informe o nome do modelo/arquivo.', 'error');
        return;
      }

      var group = document.querySelector('.printer-group[data-printer="' + impressora + '"]');
      if (group) {
        var rowsContainer = group.querySelector('.printer-group__rows');
        if (!rowsContainer) {
          rowsContainer = document.createElement('div');
          rowsContainer.className = 'printer-group__rows';
          group.appendChild(rowsContainer);
        }

        var emptyNotice = group.querySelector('.printer-group__empty');
        if (emptyNotice) emptyNotice.style.display = 'none';

        var nextIndex = String(rowsContainer.querySelectorAll('.job-row').length + 1).padStart(2, '0');

        var newRow = document.createElement('div');
        newRow.className = 'job-row';
        newRow.dataset.status = 'na-fila';
        newRow.dataset.title = nome.toLowerCase();
        newRow.innerHTML =
          '<span class="job-row__handle" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>' +
          '</span>' +
          '<span class="job-row__index">' + nextIndex + '</span>' +
          '<span class="job-material-chip">' + material + '</span>' +
          '<div class="job-row__info">' +
            '<div class="job-row__title">' + nome + '</div>' +
            '<div class="job-row__subtitle">' + maker + ' · ' + detalhes + '</div>' +
          '</div>' +
          '<span class="job-row__color">' + cor + '</span>' +
          '<div class="job-progress">' +
            '<div class="job-progress__row">' +
              '<div class="progress-bar"><div class="progress-bar__fill" style="width:0%;"></div></div>' +
              '<span class="job-progress__pct">0%</span>' +
            '</div>' +
          '</div>' +
          '<span class="job-row__time">' + tempo + '</span>' +
          '<div style="display:flex; align-items:center; gap: var(--space-3);">' +
            '<span class="badge badge-info">Na fila</span>' +
            '<div class="job-row__actions">' +
              '<button type="button" class="btn-icon btn-icon--sm btn-job-start" aria-label="Iniciar">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
              '</button>' +
              '<button type="button" class="btn-icon btn-icon--sm btn-icon--danger btn-job-remove" aria-label="Remover">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>' +
              '</button>' +
            '</div>' +
          '</div>';

        rowsContainer.appendChild(newRow);

        var metaEl = group.querySelector('.printer-group__meta');
        if (metaEl) {
          var count = rowsContainer.querySelectorAll('.job-row').length;
          metaEl.textContent = count + ' na fila';
        }

        vincularAcoesFila();
        atualizarResumoFila();
      }

      showToast('Sucesso', 'Trabalho "' + nome + '" adicionado à fila!', 'success');
      formNovaImpressao.reset();
      if (modalNovaImpressao) modalNovaImpressao.classList.remove('is-open');
    });
  }

  // Painel de Filtros Adicionais da Fila
  var btnMaisFiltros = document.getElementById('btnMaisFiltros');
  var extraFiltersPanel = document.getElementById('extraFiltersPanel');
  if (btnMaisFiltros && extraFiltersPanel) {
    btnMaisFiltros.addEventListener('click', function (e) {
      e.stopPropagation();
      extraFiltersPanel.classList.toggle('is-open');
    });
    document.addEventListener('click', function (e) {
      if (!extraFiltersPanel.contains(e.target) && e.target !== btnMaisFiltros) {
        extraFiltersPanel.classList.remove('is-open');
      }
    });

    var filtroMaterial = document.getElementById('filtroMaterial');
    var ordemTempo = document.getElementById('ordemTempo');
    if (filtroMaterial) {
      filtroMaterial.addEventListener('change', function () {
        var mat = filtroMaterial.value;
        document.querySelectorAll('.job-row').forEach(function (row) {
          var chip = row.querySelector('.job-material-chip');
          var text = chip ? chip.textContent.trim().toUpperCase() : '';
          var visible = mat === 'todos' || text === mat.toUpperCase();
          row.style.display = visible ? '' : 'none';
        });
        showToast('Filtro aplicado', mat === 'todos' ? 'Exibindo todos os materiais.' : 'Filtrando por ' + mat + '.');
      });
    }

    if (ordemTempo) {
      ordemTempo.addEventListener('change', function () {
        var ordem = ordemTempo.value;
        if (ordem === 'padrao') return;
        document.querySelectorAll('.printer-group__rows').forEach(function (rows) {
          var items = Array.from(rows.querySelectorAll('.job-row'));
          items.sort(function (a, b) {
            var timeA = a.querySelector('.job-row__time') ? a.querySelector('.job-row__time').textContent : '';
            var timeB = b.querySelector('.job-row__time') ? b.querySelector('.job-row__time').textContent : '';
            return ordem === 'rapido' ? timeA.localeCompare(timeB) : timeB.localeCompare(timeA);
          });
          items.forEach(function (el) { rows.appendChild(el); });
        });
        showToast('Ordenação aplicada', ordem === 'rapido' ? 'Mais rápidos primeiro.' : 'Mais longos primeiro.');
      });
    }
  }

});