// ==========================================
// CONFIGURACION DE SUPABASE
// Reemplaza con tus credenciales:
// Supabase -> Settings -> API
// ==========================================
const SUPABASE_URL = 'https://tzenzlqedybizjwygfic.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yK_Nd89zk4bR8HH5sNYGEQ_mOOzoUix';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
