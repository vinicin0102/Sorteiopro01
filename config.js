// Supabase Configuration
const SUPABASE_URL = 'https://uxbbhesufnxgszvbwkoa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4YmJoZXN1Zm54Z3N6dmJ3a29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MDkzODYsImV4cCI6MjA4MzM4NTM4Nn0.16abM7Od8MZxROhCY_GceU77OXwS-1Sgd9yzbj2emnQ';

// Initialize Supabase client (será inicializado após carregar a biblioteca)
let supabase = null;

// Função para inicializar Supabase quando a biblioteca carregar
function initSupabase() {
    // Tenta diferentes formas de acessar a biblioteca
    if (typeof supabaseJs !== 'undefined' && supabaseJs.createClient) {
        supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase inicializado via supabaseJs');
        return true;
    } else if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase inicializado via window.supabase');
        return true;
    } else if (typeof window.supabaseJs !== 'undefined' && window.supabaseJs.createClient) {
        supabase = window.supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase inicializado via window.supabaseJs');
        return true;
    }
    console.error('Supabase library não encontrada');
    return false;
}

// Tentar inicializar quando a página carregar
window.addEventListener('DOMContentLoaded', function() {
    setTimeout(initSupabase, 100);
});
