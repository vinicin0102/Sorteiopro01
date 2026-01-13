// Supabase Configuration
window.SUPABASE_URL = 'https://uxbbhesufnxgszvbwkoa.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4YmJoZXN1Zm54Z3N6dmJ3a29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MDkzODYsImV4cCI6MjA4MzM4NTM4Nn0.16abM7Od8MZxROhCY_GceU77OXwS-1Sgd9yzbj2emnQ';

// Initialize Supabase client (será inicializado após carregar a biblioteca)
window.supabaseClient = null;

// Função para inicializar Supabase quando a biblioteca carregar
window.initSupabase = function() {
    try {
        // A biblioteca @supabase/supabase-js via CDN pode expor de várias formas
        let supabaseLib = null;
        
        // Tenta encontrar a biblioteca
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            supabaseLib = supabase;
        } else if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            supabaseLib = window.supabase;
        }
        
        if (supabaseLib && supabaseLib.createClient) {
            window.supabaseClient = supabaseLib.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
            console.log('✅ Supabase inicializado com sucesso');
            return true;
        }
        
        console.warn('⚠️ Supabase library ainda não carregou. Aguarde...');
        return false;
    } catch (error) {
        console.error('❌ Erro ao inicializar Supabase:', error);
        return false;
    }
};

// Tentar inicializar quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(window.initSupabase, 500);
    });
} else {
    setTimeout(window.initSupabase, 500);
}
