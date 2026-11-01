/* =========================================================================
   CONFIGURAÇÃO DO CLIENTE SUPABASE
   -------------------------------------------------------------------------
   Cria o cliente usado por toda a aplicação (login, cadastro, estatísticas, fila).
   Precisa ser carregado DEPOIS do script da Supabase CDN e ANTES de
   js/script.js — veja a ordem nos <script> de cada página HTML.

   A chave abaixo é a "publishable key" (pública): é segura para ficar
   exposta no navegador. Quem protege os dados de verdade é o RLS (Row
   Level Security) configurado nas tabelas do banco.
   ========================================================================= */

const SUPABASE_URL = "https://jdbutpieqicrfuuqneky.supabase.co";
const SUPABASE_KEY = "sb_publishable_Qrduz9SnxcX-Rgeis_A4ng_-UXZl4Ti";

let supabaseClient = null;

try {
  if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("[PrintFlow] Cliente Supabase inicializado com sucesso.");
  } else if (typeof createClient === 'function') {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("[PrintFlow] Cliente Supabase inicializado com createClient.");
  }
} catch (err) {
  console.warn("[PrintFlow] Aviso ao inicializar Supabase:", err);
}

// Helper global para obter o cliente de qualquer script
function getSupabase() {
  return supabaseClient;
}