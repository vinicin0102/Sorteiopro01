// Supabase Configuration
const SUPABASE_URL = 'https://uxbbhesufnxgszvbwkoa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4YmJoZXN1Zm54Z3N6dmJ3a29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MDkzODYsImV4cCI6MjA4MzM4NTM4Nn0.16abM7Od8MZxROhCY_GceU77OXwS-1Sgd9yzbj2emnQ';

// Initialize Supabase client (será inicializado após carregar a biblioteca)
let supabase = null;

// Função para inicializar Supabase quando a biblioteca carregar
function initSupabase() {
    if (typeof supabaseJs !== 'undefined') {
        supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return true;
    }
    return false;
}
