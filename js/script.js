/* =========================================================================
   PRINTFLOW - SISTEMA DE GESTÃO DE IMPRESSÃO 3D (MAKER & OPERADOR)
   ========================================================================= */

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
  return path === '' || path === '/' ||
    path.endsWith('/index') || path.endsWith('/index.html') || path.endsWith('index.html') ||
    path.endsWith('/login') || path.endsWith('/login.html') || path.endsWith('login.html');
}

/* =========================================================================
   VERIFICAÇÃO DE AUTENTICAÇÃO E PERMISSÕES EM CADA PÁGINA
   ========================================================================= */
function checkRolePermissions(user, currentPath) {
  if (!user) return true;
  const path = currentPath.toLowerCase();

  // Telas públicas ou livres para todos os autenticados
  if (path.endsWith('espacos.html') || path.endsWith('espacos') ||
      path.endsWith('perfil.html') || path.endsWith('perfil')) {
    return true;
  }

  // Verifica se o usuário ingressou em um espaço
  const joinedSpace = getJoinedSpace();
  const hasIngressado = !!joinedSpace;

  // Telas do aplicativo liberadas após ingressar no espaço
  if (hasIngressado) {
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
  const isOperador = role === 'OPERADOR';

  const joinedSpace = getJoinedSpace();
  const hasIngressado = !!joinedSpace;

  document.querySelectorAll('.sidebar__nav a').forEach(function (link) {
    const href = (link.getAttribute('href') || '').toLowerCase();

    if (hasIngressado) {
      link.style.display = '';
    } else {
      if (href.includes('dashboard') || href.includes('impressoras') || href.includes('fila') || href.includes('historico')) {
        link.style.display = 'none';
      }
    }
  });

  document.querySelectorAll('.mobile-bottom-nav a').forEach(function (item) {
    const href = (item.getAttribute('href') || '').toLowerCase();
    if (hasIngressado) {
      item.style.display = '';
    } else {
      if (href.includes('dashboard') || href.includes('impressoras')) {
        item.style.display = 'none';
      }
    }
  });

  // Botão de Criar Espaço: Operador pode criar; Maker não
  const btnCriarEspaco = document.getElementById('btnAbrirModalEspaco');
  if (btnCriarEspaco) {
    if (isOperador) {
      btnCriarEspaco.style.display = '';
      btnCriarEspaco.disabled = false;
    } else {
      btnCriarEspaco.style.display = 'none';
      btnCriarEspaco.disabled = true;
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
    if (!token && !getStoredUser()) {
      window.location.href = 'login.html';
      return;
    }

    // Se temos cliente Supabase disponível, sincroniza sessão
    if (typeof supabaseClient !== 'undefined' && supabaseClient && supabaseClient.auth) {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session && session.user) {
          const userObj = {
            id: session.user.id,
            nome: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
            email: session.user.email,
            role: session.user.user_metadata?.role || (getStoredUser()?.role || 'MAKER'),
            token: session.access_token
          };
          setAuthSession(userObj.token, userObj);
          const allowed = checkRolePermissions(userObj, currentPath);
          if (allowed) {
            updateUserUI(userObj);
            adaptSidebarForRole(userObj);
          }
          return;
        }
      } catch (err) {
        console.warn('Verificação de sessão Supabase:', err);
      }
    }

    // Sessão local (usuário salvo em localStorage)
    const savedUser = getStoredUser();
    if (savedUser) {
      const allowed = checkRolePermissions(savedUser, currentPath);
      if (allowed) {
        updateUserUI(savedUser);
        adaptSidebarForRole(savedUser);
      }
    } else {
      clearAuthSession();
      window.location.href = 'login.html';
    }
  } else if (currentPath.endsWith('login') || currentPath.endsWith('login.html')) {
    // Páginas de login: se já estiver logado, redireciona para a tela de espaços
    if (token || getStoredUser()) {
      window.location.href = 'espacos.html';
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

  // Atualiza nome de saudação e estatísticas exclusivas do usuário logado no dashboard
  const userGreeting = document.getElementById('userGreetingName');
  if (userGreeting) {
    userGreeting.textContent = user.nome || user.username || (user.email ? user.email.split('@')[0] : 'Usuário');
  }
  carregarEstatisticasUsuarioLogado(user);
}

/* =========================================================================
   ESTATÍSTICAS PESSOAIS DO USUÁRIO LOGADO
   ========================================================================= */
function carregarEstatisticasUsuarioLogado(user) {
  const activeEl = document.getElementById('userStatActive');
  const completedEl = document.getElementById('userStatCompleted');
  const hoursEl = document.getElementById('userStatHours');
  const filamentEl = document.getElementById('userStatFilament');
  const greetingEl = document.getElementById('userGreetingName');

  if (!activeEl && !completedEl && !hoursEl && !filamentEl && !greetingEl) return;

  const currentUser = user || getStoredUser();
  const userName = currentUser ? (currentUser.nome || currentUser.username || (currentUser.email ? currentUser.email.split('@')[0] : 'Usuário')) : 'Usuário';

  if (greetingEl) {
    greetingEl.textContent = userName;
  }

  // Chave específica do usuário no localStorage
  const userKey = 'printflow_user_stats_' + (currentUser?.id || userName.toLowerCase().replace(/\s+/g, '_'));
  let stats = null;
  try {
    const raw = localStorage.getItem(userKey);
    if (raw) stats = JSON.parse(raw);
  } catch (e) {}

  if (!stats) {
    // Estatísticas iniciais pessoais do usuário
    stats = {
      active: 1,
      completed: 3,
      minutes: 265, // 4h 25m
      filamentGrams: 145
    };
    try {
      localStorage.setItem(userKey, JSON.stringify(stats));
    } catch(e) {}
  }

  if (activeEl) activeEl.textContent = stats.active;
  if (completedEl) completedEl.textContent = stats.completed;
  if (hoursEl) {
    const h = Math.floor(stats.minutes / 60);
    const m = stats.minutes % 60;
    hoursEl.textContent = (h > 0 ? h + 'h ' : '') + m + 'm';
  }
  if (filamentEl) filamentEl.textContent = stats.filamentGrams + 'g';

  // Se Supabase estiver conectado, sincroniza em tempo real com histórico do usuário
  if (typeof supabaseClient !== 'undefined' && supabaseClient && currentUser) {
    supabaseClient
      .from('historico_impressao')
      .select('*')
      .then(function (res) {
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          const userPrints = res.data.filter(function (item) {
            return (item.usuario_id && item.usuario_id === currentUser.id) ||
                   (item.usuario_nome && item.usuario_nome.toLowerCase().includes(userName.toLowerCase())) ||
                   (item.usuario_email && item.usuario_email === currentUser.email);
          });

          if (userPrints.length > 0) {
            let concluidas = 0;
            let minutos = 0;
            let gramas = 0;
            userPrints.forEach(function (p) {
              if (p.resultado === 'Concluído') concluidas++;
              if (p.tempo_real) minutos += Number(p.tempo_real);
              if (p.peso_gramas) gramas += Number(p.peso_gramas);
            });

            if (completedEl) completedEl.textContent = concluidas;
            if (hoursEl && minutos > 0) {
              const h = Math.floor(minutos / 60);
              const m = minutos % 60;
              hoursEl.textContent = (h > 0 ? h + 'h ' : '') + m + 'm';
            }
            if (filamentEl && gramas > 0) {
              filamentEl.textContent = gramas + 'g';
            }
          }
        }
      })
      .catch(function () {});
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
    loginForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const email = document.getElementById('loginEmail').value.trim();
      const senha = document.getElementById('loginSenha').value;

      if (!email || !senha) {
        showToast('Atenção', 'Informe e-mail e senha.', 'error');
        return;
      }

      // 1. Tentativa via Supabase Auth se cliente estiver disponível
      if (typeof supabaseClient !== 'undefined' && supabaseClient && supabaseClient.auth) {
        try {
          const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: senha
          });
          if (!error && data && data.user) {
            const userObj = {
              id: data.user.id,
              nome: data.user.user_metadata?.full_name || email.split('@')[0],
              email: data.user.email,
              role: data.user.user_metadata?.role || 'MAKER',
              token: data.session?.access_token || 'supabase-token'
            };
            setAuthSession(userObj.token, userObj);
            showToast('Sucesso', 'Autenticado via Supabase!', 'success');
            setTimeout(function () {
              window.location.href = 'fila.html';
            }, 500);
            return;
          }
        } catch (supaErr) {
          console.warn('Tentativa Supabase:', supaErr);
        }
      }

      // 2. Fallback inteligente para demonstração/teste local
      if (email.includes('printflow') || senha === '123456' || senha === 'operador' || senha === 'senha123') {
        const role = email.includes('operador') ? 'OPERADOR' : 'MAKER';
        const namePart = email.split('@')[0].replace(/[._]/g, ' ');
        const nomeFormatado = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        const demoUser = {
          id: 99,
          nome: nomeFormatado || 'Mariana Santos',
          email: email,
          role: role,
          perfil: role,
          username: email.split('@')[0]
        };
        setAuthSession('demo-token-local', demoUser);
        showToast('Login Efetuado', 'Sessão iniciada como ' + demoUser.nome + ' (' + role + ')', 'success');
        setTimeout(function () {
          window.location.href = 'fila.html';
        }, 500);
        return;
      }

      showToast('Erro no login', 'Credenciais inválidas. Verifique seu e-mail e senha.', 'error');
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

  setupModal('btnAbrirModalIngressar', 'modalIngressar', 'btnFecharModalIngressar', 'btnCancelarModalIngressar');
  setupModal(null, 'modalFilamento', 'btnFecharModalFilamento', 'btnCancelarModalFilamento');
  setupModal('btnAbrirModalImpressao', 'modalNovaImpressao', 'btnFecharModalImpressao', 'btnCancelarModalImpressao');
  setupModal(null, 'modalDetalhesJob', 'btnFecharModalDetalhes', 'btnFecharDetalhes');
  setupModal('btnAbrirModalExcluir', 'modalExcluirPerfil', 'btnFecharModalExcluir', 'btnCancelarModalExcluir');

  /* =======================================================================
     3. GERENCIAMENTO DE FILAMENTOS
     ======================================================================= */

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

      async function ingressar() {
        var spaceInfo = {
          id: Date.now(),
          codigo: codigoUpper,
          nome: 'Espaço ' + codigoUpper,
          responsavel: 'Membro',
          role: 'Membro',
          ingressadoEm: new Date().toISOString()
        };

        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
          try {
            var { data } = await supabaseClient.from('espacos').select('*').limit(10);
            if (Array.isArray(data)) {
              var encontrado = data.find(function (e) {
                return (e.codigo && e.codigo.trim().toUpperCase() === codigoUpper) ||
                       (e.nome && e.nome.trim().toUpperCase().includes(codigoUpper)) ||
                       (e.id && String(e.id) === codigo);
              });
              if (encontrado) {
                spaceInfo.id = encontrado.id;
                spaceInfo.nome = encontrado.nome || spaceInfo.nome;
                spaceInfo.responsavel = encontrado.responsavel || 'Membro';
              }
            }
          } catch (e) {
            console.warn('Busca espaço Supabase:', e);
          }
        }

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
      }

      ingressar();
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
    if (role === 'OPERADOR') return;

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
     6. SIDEBAR (ABRIR E FECHAR — DESKTOP E MOBILE)
     ======================================================================= */
  var sidebar = document.getElementById('sidebar');
  var sidebarBackdrop = document.getElementById('sidebarBackdrop');
  var mobileMenuBtn = document.getElementById('mobileMenuBtn');
  var dashboardLayout = document.getElementById('dashboardLayout') || document.querySelector('.dashboard-layout');

  // Restaura preferência salva do menu no desktop
  if (dashboardLayout && localStorage.getItem('printflow_sidebar_collapsed') === 'true' && window.innerWidth > 900) {
    dashboardLayout.classList.add('sidebar-collapsed');
  }

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

  function toggleDesktopSidebar() {
    if (!dashboardLayout) return;
    var isCollapsed = dashboardLayout.classList.toggle('sidebar-collapsed');
    localStorage.setItem('printflow_sidebar_collapsed', isCollapsed ? 'true' : 'false');
    showToast('Menu', isCollapsed ? 'Sidebar recolhida.' : 'Sidebar expandida.');
  }

  function toggleSidebar(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (window.innerWidth <= 900) {
      if (sidebar && sidebar.classList.contains('is-open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    } else {
      toggleDesktopSidebar();
    }
  }

  // O botão que tem a logo e está escrito PrintFlow abre e fecha a sidebar
  var brandToggleSelectors = [
    '#sidebarBrandToggle',
    '.sidebar__brand',
    '#topbarBrandToggle',
    '.topbar .brand',
    '.topbar .brand--pill'
  ];
  document.querySelectorAll(brandToggleSelectors.join(',')).forEach(function (btn) {
    btn.addEventListener('click', toggleSidebar);
  });

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleSidebar);
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

    if (page === 'perfil' || page === 'perfil.html') {
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
    logoutButton.addEventListener('click', async function () {
      if (typeof supabaseClient !== 'undefined' && supabaseClient && supabaseClient.auth) {
        try {
          await supabaseClient.auth.signOut();
        } catch (e) {
          console.warn('Aviso logout Supabase:', e);
        }
      }
      clearAuthSession();
      window.location.href = 'login.html';
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
     14. FILA DE IMPRESSÃO (Acompanhamento, Modais, Cores e Ações)
     ======================================================================= */
  var formNovaImpressao = document.getElementById('formNovaImpressao');
  var modalNovaImpressao = document.getElementById('modalNovaImpressao');
  var modalDetalhesJob = document.getElementById('modalDetalhesJob');

  var btnAbrirModalImpressao = document.getElementById('btnAbrirModalImpressao');
  var btnFecharModalImpressao = document.getElementById('btnFecharModalImpressao');
  var btnCancelarModalImpressao = document.getElementById('btnCancelarModalImpressao');

  var btnFecharModalDetalhes = document.getElementById('btnFecharModalDetalhes');
  var btnFecharDetalhes = document.getElementById('btnFecharDetalhes');

  // Abrir Modal de Nova Impressão
  if (btnAbrirModalImpressao && modalNovaImpressao) {
    btnAbrirModalImpressao.addEventListener('click', function () {
      var currentUser = (typeof getStoredUser === 'function') ? getStoredUser() : null;
      var makerInput = document.getElementById('jobMaker');
      if (makerInput && currentUser) {
        makerInput.value = currentUser.nome || currentUser.username || 'Mariana Santos';
      }
      modalNovaImpressao.classList.add('is-open');
    });
  }

  // Fechar Modal de Nova Impressão
  if (btnFecharModalImpressao && modalNovaImpressao) {
    btnFecharModalImpressao.addEventListener('click', function () {
      modalNovaImpressao.classList.remove('is-open');
    });
  }
  if (btnCancelarModalImpressao && modalNovaImpressao) {
    btnCancelarModalImpressao.addEventListener('click', function () {
      modalNovaImpressao.classList.remove('is-open');
    });
  }

  // Fechar Modal de Detalhes
  if (btnFecharModalDetalhes && modalDetalhesJob) {
    btnFecharModalDetalhes.addEventListener('click', function () {
      modalDetalhesJob.classList.remove('is-open');
    });
  }
  if (btnFecharDetalhes && modalDetalhesJob) {
    btnFecharDetalhes.addEventListener('click', function () {
      modalDetalhesJob.classList.remove('is-open');
    });
  }

  function atualizarResumoFila() {
    var allRows = document.querySelectorAll('.job-row');
    var totalTrabalhos = allRows.length;
    var summaryEl = document.getElementById('queueSummary');
    if (summaryEl) {
      summaryEl.textContent = totalTrabalhos + ' trabalhos na fila · monitoramento em tempo real';
    }

    var myJobs = 0;
    var myActive = 0;
    var myCompleted = 0;

    allRows.forEach(function (row) {
      var isUser = row.dataset.isUser === 'true' || row.classList.contains('job-row--user-highlight');
      var status = row.dataset.status;
      if (isUser) {
        myJobs++;
        if (status === 'imprimindo') myActive++;
        if (status === 'concluido') myCompleted++;
      }
    });

    var badgeTotal = document.getElementById('badgeTotalJobs');
    if (badgeTotal) badgeTotal.textContent = totalTrabalhos;

    var badgeMy = document.getElementById('badgeMyJobs');
    if (badgeMy) badgeMy.textContent = myJobs;

    var statGeneral = document.getElementById('statGeneralQueueCount');
    if (statGeneral) statGeneral.textContent = totalTrabalhos;

    var statMyActive = document.getElementById('statMyActiveCount');
    if (statMyActive) statMyActive.textContent = myActive;

    var statMyComp = document.getElementById('statMyCompletedCount');
    if (statMyComp) statMyCompletedCount.textContent = myCompleted;
  }

  function vincularAcoesFila() {
    // Pausar
    document.querySelectorAll('.btn-job-pause').forEach(function (btn) {
      btn.onclick = function (e) {
        e.preventDefault();
        var row = btn.closest('.job-row');
        if (!row) return;
        row.dataset.status = 'pausado';
        var badge = row.querySelector('.badge:not(.badge-user-highlight)');
        if (badge) {
          badge.className = 'badge badge-neutral';
          badge.textContent = 'Pausado';
        }
        btn.outerHTML =
          '<button type="button" class="btn-icon btn-icon--sm btn-job-resume" aria-label="Retomar">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
          '</button>';
        vincularAcoesFila();
        atualizarResumoFila();
        showToast('Pausado', 'Impressão pausada.');
      };
    });

    // Iniciar ou Retomar (Cor de Imprimindo: Verde Neon)
    document.querySelectorAll('.btn-job-start, .btn-job-resume').forEach(function (btn) {
      btn.onclick = function (e) {
        e.preventDefault();
        var row = btn.closest('.job-row');
        if (!row) return;
        row.dataset.status = 'imprimindo';
        var badge = row.querySelector('.badge:not(.badge-user-highlight)');
        if (badge) {
          badge.className = 'badge badge-printing';
          badge.innerHTML = '<span class="status-dot status-dot--printing" style="width:6px; height:6px;"></span> Imprimindo';
        }
        var fill = row.querySelector('.progress-bar__fill');
        if (fill) {
          fill.className = 'progress-bar__fill progress-bar__fill--printing';
          if (!fill.style.width || fill.style.width === '0%') fill.style.width = '25%';
        }
        btn.outerHTML =
          '<button type="button" class="btn-icon btn-icon--sm btn-job-pause" aria-label="Pausar">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>' +
          '</button>';
        vincularAcoesFila();
        atualizarResumoFila();
        showToast('Em andamento', 'Impressão iniciada / retomada na impressora!');
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
        var badge = row.querySelector('.badge:not(.badge-user-highlight)');
        if (badge) {
          badge.className = 'badge badge-queued';
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
        atualizarResumoFila();
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
        var badgeEl = row.querySelector('.badge:not(.badge-user-highlight)');
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
  atualizarResumoFila();

  // Formulário de Nova Impressão
  if (formNovaImpressao) {
    formNovaImpressao.addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = document.getElementById('jobNome').value.trim();
      var impressora = document.getElementById('jobImpressora').value;
      var maker = document.getElementById('jobMaker').value.trim() || 'Mariana Santos';
      var material = document.getElementById('jobMaterial').value;
      var cor = document.getElementById('jobCor').value.trim() || 'Preto';
      var tempo = document.getElementById('jobTempo').value.trim() || '1h 15m';
      var detalhes = document.getElementById('jobDetalhes').value.trim() || '45g · 0.2mm';

      if (!nome) {
        showToast('Atenção', 'Informe o nome do modelo/arquivo.', 'error');
        return;
      }

      var group = document.querySelector('.printer-group[data-printer="' + impressora + '"]');
      if (group) {
        var printerDisplayName = group.querySelector('.printer-group__name') ? group.querySelector('.printer-group__name').textContent : impressora;
        var rowsContainer = group.querySelector('.printer-group__rows');
        if (!rowsContainer) {
          rowsContainer = document.createElement('div');
          rowsContainer.className = 'printer-group__rows';
          group.appendChild(rowsContainer);
        }

        var emptyNotice = group.querySelector('.printer-group__empty');
        if (emptyNotice) emptyNotice.style.display = 'none';

        var nextIndex = String(rowsContainer.querySelectorAll('.job-row').length + 1).padStart(2, '0');

        // Cria a linha destacada do trabalho do usuário com impressora e badge
        var newRow = document.createElement('div');
        newRow.className = 'job-row job-row--user-highlight';
        newRow.dataset.status = 'na-fila';
        newRow.dataset.title = nome.toLowerCase();
        newRow.dataset.isUser = 'true';
        newRow.dataset.printerName = printerDisplayName;
        newRow.innerHTML =
          '<span class="job-row__handle" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>' +
          '</span>' +
          '<span class="job-row__index">' + nextIndex + '</span>' +
          '<span class="job-material-chip">' + material + '</span>' +
          '<div class="job-row__info">' +
            '<div style="display:flex; align-items:center; gap:var(--space-2); flex-wrap:wrap;">' +
              '<span class="job-row__title">' + nome + '</span>' +
              '<span class="badge badge-user-highlight">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>' +
                'Sua Impressão' +
              '</span>' +
              '<span class="job-printer-tag">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="9" width="16" height="7" rx="1.5"/><path d="M7 9V6a2 2 0 012-2h6a2 2 0 012 2v3"/></svg>' +
                'Impressora: <strong>' + printerDisplayName + '</strong>' +
              '</span>' +
            '</div>' +
            '<div class="job-row__subtitle">Você (' + maker + ') · ' + detalhes + '</div>' +
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
            '<span class="badge badge-queued">Na fila</span>' +
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

        // Incrementa contagem de impressões ativas do usuário logado
        var currentUserStats = getStoredUser();
        if (currentUserStats) {
          var uKey = 'printflow_user_stats_' + (currentUserStats.id || (currentUserStats.nome || 'padrao').toLowerCase().replace(/\s+/g, '_'));
          try {
            var uStats = JSON.parse(localStorage.getItem(uKey) || '{"active": 1, "completed": 3, "minutes": 265, "filamentGrams": 145}');
            uStats.active += 1;
            uStats.filamentGrams += 45;
            uStats.minutes += 75;
            localStorage.setItem(uKey, JSON.stringify(uStats));
          } catch(e) {}
        }
      }

      showToast('Sucesso', 'Trabalho "' + nome + '" adicionado à fila para a impressora ' + (printerDisplayName || impressora) + '!', 'success');
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