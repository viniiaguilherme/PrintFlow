/* =========================================================================
   PROTEÇÃO DE ROTAS
   -------------------------------------------------------------------------
   index.html, login.html e cadastro.html podem ser vistas sem sessão ativa.
   Qualquer outra página (dashboard, espaços, fila, impressoras, usuários,
   configurações) exige um usuário logado no Supabase — caso contrário,
   redireciona para login.html.

   Importante: isso é só uma conveniência de navegação no front-end. Quem
   realmente protege os dados é o RLS configurado nas tabelas do Supabase;
   mesmo sem essa checagem, ninguém sem sessão consegue ler/escrever dados
   sensíveis.
   ========================================================================= */
(function () {
  var PAGINAS_PUBLICAS = ['', 'index.html', 'login.html', 'cadastro.html'];
  var paginaAtual = window.location.pathname.split('/').pop();

  if (PAGINAS_PUBLICAS.indexOf(paginaAtual) === -1) {
    supabase.auth.getSession().then(function (resultado) {
      if (!resultado.data.session) {
        window.location.href = 'login.html';
      }
    });
  }
})();


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

// E-MAIL DO USUÁRIO -> usado apenas pelo botão "Simular Alerta" do dashboard.
// TODO: quando o alerta de falha real for implementado, buscar o e-mail do
// usuário logado via supabase.auth.getUser() em vez de usar um valor fixo.
const emailUsuario = "vinii.aguilherme@gmail.com";


/* =========================================================================
   TOASTS (notificações rápidas no canto da tela)
   -------------------------------------------------------------------------
   Função global para poder ser chamada tanto pelas interações internas
   deste arquivo quanto pela função simularAlerta() logo abaixo, que é
   acionada via onclick="" direto no HTML do botão "Simular Alerta".

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
     2. LOGIN — via Supabase Auth
     ======================================================================= */
  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const email = document.getElementById('loginEmail').value.trim();
      const senha = document.getElementById('loginSenha').value;

      if (!email || !senha) {
        showToast('Atenção', 'Preencha todos os campos.', 'error');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: senha
      });

      if (error) {
        showToast('Erro no login', error.message, 'error');
        return;
      }

      window.location.href = 'espacos.html';
    });
  }

  /* =======================================================================
     3. CADASTRO — via Supabase Auth
     -------------------------------------------------------------------------
     nome vai no "data" do signUp; um gatilho no banco (handle_new_user)
     copia esse valor pra tabela public.usuarios assim que a conta é criada.
     Cargo não é coletado aqui — é atribuído ao usuário dentro de um
     espaço, em uma etapa futura.
     ======================================================================= */
  var cadastroForm = document.getElementById('cadastroForm');
  if (cadastroForm) {
    cadastroForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const nome = document.getElementById('cadastroNome').value.trim();
      const email = document.getElementById('cadastroEmail').value.trim();
      const senha = document.getElementById('cadastroSenha').value;
      const confirmarSenha = document.getElementById('cadastroConfirmarSenha').value;

      if (!nome || !email || !senha) {
        showToast('Atenção', 'Preencha todos os campos obrigatórios.', 'error');
        return;
      }

      if (senha !== confirmarSenha) {
        showToast('Erro', 'As senhas não coincidem!', 'error');
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: email,
        password: senha,
        options: {
          data: { nome: nome }
        }
      });

      if (error) {
        showToast('Erro no cadastro', error.message, 'error');
        return;
      }

      showToast('Sucesso', 'Cadastro realizado! Verifique seu e-mail para confirmar a conta antes de entrar.', 'success');
      setTimeout(function () {
        window.location.href = 'login.html';
      }, 1500);
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
     7. BOTÃO "SAIR" — encerra a sessão no Supabase e volta pra tela inicial
     ======================================================================= */
  var logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', async function () {
      await supabase.auth.signOut();
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
     10. ESTATÍSTICAS GERAIS (página inicial)
     -------------------------------------------------------------------------
     Substitui o antigo fetch('buscar_estatisticas.php') por uma chamada
     RPC à função estatisticas_gerais() no Supabase.
     ======================================================================= */
  if (document.getElementById("espacos")) {
    supabase.rpc('estatisticas_gerais').then(function (resultado) {
      if (resultado.error) {
        console.error("Erro ao buscar estatísticas:", resultado.error);
        return;
      }

      var dados = resultado.data;

      document.getElementById("espacos").textContent = dados.espacos;
      document.getElementById("impressoras").textContent = dados.impressoras_cadastradas;
      document.getElementById("usuarios").textContent = dados.usuarios_cadastrados;
      document.getElementById("impressoes").textContent = dados.impressoes_totais;
    });
  }

  /* =======================================================================
     11. ESTATÍSTICAS DO ESPAÇO (dashboard)
     -------------------------------------------------------------------------
     Substitui o antigo fetch('buscar_estatisticas_espaco.php?espaco_id=...')
     por uma chamada RPC à função estatisticas_espaco(p_espaco_id).
     ======================================================================= */
  if (document.getElementById("estatisticaImpressoras")) {
    var espacoId = 1;

    supabase.rpc('estatisticas_espaco', { p_espaco_id: espacoId }).then(function (resultado) {
      if (resultado.error) {
        console.error("Erro ao buscar estatísticas do espaço:", resultado.error);
        return;
      }

      var dados = resultado.data;

      if (!dados) {
        console.error("Espaço não encontrado.");
        return;
      }

      document.getElementById("estatisticaImpressoras").textContent = dados.impressoras;
      document.getElementById("estatisticaFilas").textContent = dados.filas;
      document.getElementById("estatisticaAlertas").textContent = dados.alertas;
      document.getElementById("estatisticaUsuarios").textContent = dados.usuarios;
    });
  }

  /* =======================================================================
     12. ESTATÍSTICAS DE USUÁRIOS (usuarios.html)
     -------------------------------------------------------------------------
     Substitui o antigo fetch('buscar_estatisticas_usuarios.php') por uma
     chamada RPC à função estatisticas_usuarios().
     ======================================================================= */
  if (document.getElementById("estatisticaMembros")) {
    supabase.rpc('estatisticas_usuarios').then(function (resultado) {
      if (resultado.error) {
        console.error("Erro ao buscar estatísticas de usuários:", resultado.error);
        return;
      }

      var dados = resultado.data;

      document.getElementById("estatisticaMembros").textContent = dados.total_membros;
      document.getElementById("estatisticaAtivos").textContent = dados.ativos_agora;
      document.getElementById("estatisticaImpressoesUsuarios").textContent = dados.total_impressoes;
      document.getElementById("estatisticaFilamentoUsuarios").textContent = dados.filamento_usado_kg + " kg";
    });
  }

});
