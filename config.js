// Supabase Configuration
const SUPABASE_URL = 'https://uxbbhesufnxgszvbwkoa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4YmJoZXN1Zm54Z3N6dmJ3a29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MDkzODYsImV4cCI6MjA4MzM4NTM4Nn0.16abM7Od8MZxROhCY_GceU77OXwS-1Sgd9yzbj2emnQ';

// Initialize Supabase client (será inicializado após carregar a biblioteca)
let supabaseClient = null;

// Função para inicializar Supabase quando a biblioteca carregar
function initSupabase() {
    try {
        // A biblioteca @supabase/supabase-js via CDN expõe como window.supabase
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase inicializado');
            return true;
        }
        console.warn('⚠️ Supabase library ainda não carregou');
        return false;
    } catch (error) {
        console.error('❌ Erro ao inicializar Supabase:', error);
        return false;
    }
}

// Tentar inicializar quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initSupabase, 500);
    });
} else {
    setTimeout(initSupabase, 500);
}
