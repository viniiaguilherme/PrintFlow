/* =========================================================================
   CONFIGURAÇÃO DO CLIENTE SUPABASE
   -------------------------------------------------------------------------
   Cria o cliente usado por toda a aplicação (login, cadastro, estatísticas).
   Precisa ser carregado DEPOIS do script da Supabase CDN e ANTES de
   js/script.js — veja a ordem nos <script> de cada página HTML.

   A chave abaixo é a "publishable key" (pública): é segura para ficar
   exposta no navegador. Quem protege os dados de verdade é o RLS (Row
   Level Security) configurado nas tabelas do banco.
   ========================================================================= */

const SUPABASE_URL = "https://jdbutpieqicrfuuqneky.supabase.co";
const SUPABASE_KEY = "sb_publishable_Qrduz9SnxcX-Rgeis_A4ng_-UXZl4Ti";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
