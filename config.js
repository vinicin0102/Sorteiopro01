// Supabase Configuration
window.SUPABASE_URL = 'https://uxbbhesufnxgszvbwkoa.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4YmJoZXN1Zm54Z3N6dmJ3a29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MDkzODYsImV4cCI6MjA4MzM4NTM4Nn0.16abM7Od8MZxROhCY_GceU77OXwS-1Sgd9yzbj2emnQ';

// Initialize Supabase client (será inicializado após carregar a biblioteca)
window.supabaseClient = null;

// Função para inicializar Supabase quando a biblioteca carregar
window.initSupabase = function() {
    try {
        // A biblioteca @supabase/supabase-js expõe como window.supabase ou supabase globalmente
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            window.supabaseClient = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
            console.log('✅ Supabase inicializado via supabase global');
            return true;
        } else if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
            console.log('✅ Supabase inicializado via window.supabase');
            return true;
        }
        console.error('❌ Supabase library não encontrada');
        return false;
    } catch (error) {
        console.error('❌ Erro ao inicializar Supabase:', error);
        return false;
    }
};

// Tentar inicializar quando a página carregar
window.addEventListener('DOMContentLoaded', function() {
    setTimeout(window.initSupabase, 300);
});
