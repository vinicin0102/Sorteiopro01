// Database Functions - Supabase Integration

// Wait for Supabase to be loaded
async function getSupabase() {
    // Se já foi inicializado, retorna
    if (supabase) {
        return supabase;
    }
    
    // Tenta inicializar
    if (typeof supabaseJs !== 'undefined' && supabaseJs.createClient) {
        supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase inicializado em getSupabase()');
        return supabase;
    } else if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase inicializado via window.supabase em getSupabase()');
        return supabase;
    }
    
    console.warn('Supabase não disponível, usando fallback localStorage');
    return null;
}

// ============ PARTICIPANTES ============

// Salvar participante
async function saveParticipant(nome, celular) {
    try {
        const db = await getSupabase();
        if (!db) {
            console.error('Supabase não inicializado');
            // Fallback para localStorage
            return saveParticipantLocalStorage(nome, celular);
        }

        const phoneOnly = celular.replace(/\D/g, '');
        
        // Verificar se já existe
        const { data: existing } = await db
            .from('participantes')
            .select('*')
            .eq('celular_normalizado', phoneOnly)
            .single();

        if (existing) {
            // Atualizar se já existe
            const { data, error } = await db
                .from('participantes')
                .update({
                    nome: nome,
                    celular: celular,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        }

        // Criar novo
        const { data, error } = await db
            .from('participantes')
            .insert({
                nome: nome,
                celular: celular,
                celular_normalizado: phoneOnly,
                device: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        
        // Retornar objeto formatado
        return {
            nome: data.nome,
            celular: data.celular,
            created_at: data.created_at,
            timestamp: data.created_at,
            device: data.device,
            id: data.id
        };
    } catch (error) {
        console.error('Erro ao salvar participante:', error);
        // Fallback para localStorage - sempre retorna algo
        const fallback = saveParticipantLocalStorage(nome, celular);
        return fallback;
    }
}

// Buscar todos os participantes
async function getAllParticipants() {
    try {
        const db = await getSupabase();
        if (!db) {
            console.log('Usando fallback localStorage para participantes');
            return JSON.parse(localStorage.getItem('webinar_participantes') || '[]');
        }

        console.log('Buscando participantes do Supabase...');
        const { data, error } = await db
            .from('participantes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar participantes do Supabase:', error);
            throw error;
        }
        
        console.log(`Participantes encontrados no Supabase: ${data?.length || 0}`);
        return data || [];
    } catch (error) {
        console.error('Erro ao buscar participantes:', error);
        console.log('Tentando usar fallback localStorage...');
        return JSON.parse(localStorage.getItem('webinar_participantes') || '[]');
    }
}

// Buscar participante por celular
async function getParticipantByPhone(celular) {
    try {
        const db = await getSupabase();
        if (!db) return null;

        const phoneOnly = celular.replace(/\D/g, '');
        const { data, error } = await db
            .from('participantes')
            .select('*')
            .eq('celular_normalizado', phoneOnly)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar participante:', error);
        return null;
    }
}

// ============ GANHADORES ============

// Salvar ganhadores
async function saveWinners(winners) {
    try {
        const db = await getSupabase();
        if (!db) {
            localStorage.setItem('webinar_winners', JSON.stringify(winners));
            return true;
        }

        // Limpar ganhadores anteriores
        await db.from('ganhadores').delete().neq('id', 0);

        // Inserir novos ganhadores
        const winnersData = winners.map(winner => ({
            participante_id: winner.id || null,
            nome: winner.nome,
            celular: winner.celular,
            created_at: new Date().toISOString()
        }));

        const { error } = await db.from('ganhadores').insert(winnersData);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Erro ao salvar ganhadores:', error);
        localStorage.setItem('webinar_winners', JSON.stringify(winners));
        return false;
    }
}

// Buscar ganhadores
async function getWinners() {
    try {
        const db = await getSupabase();
        if (!db) {
            return JSON.parse(localStorage.getItem('webinar_winners') || '[]');
        }

        const { data, error } = await db
            .from('ganhadores')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao buscar ganhadores:', error);
        return JSON.parse(localStorage.getItem('webinar_winners') || '[]');
    }
}

// Verificar se usuário é ganhador
async function checkIfWinner(celular) {
    try {
        const winners = await getWinners();
        if (!celular) return false;

        const phoneOnly = celular.replace(/\D/g, '');
        return winners.some(winner => {
            const winnerPhone = (winner.celular || '').replace(/\D/g, '');
            return winnerPhone === phoneOnly;
        });
    } catch (error) {
        console.error('Erro ao verificar ganhador:', error);
        return false;
    }
}

// ============ CONFIGURAÇÕES DO ADMIN ============

// Salvar configurações do formulário
async function saveFormConfig(config) {
    try {
        const db = await getSupabase();
        if (!db) {
            localStorage.setItem('admin_form_data', JSON.stringify(config));
            return true;
        }

        const { error } = await db
            .from('configuracoes')
            .upsert({
                id: 1,
                tipo: 'formulario',
                dados: config,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Erro ao salvar configuração:', error);
        localStorage.setItem('admin_form_data', JSON.stringify(config));
        return false;
    }
}

// Buscar configurações do formulário
async function getFormConfig() {
    try {
        const db = await getSupabase();
        if (!db) {
            return JSON.parse(localStorage.getItem('admin_form_data') || '{}');
        }

        const { data, error } = await db
            .from('configuracoes')
            .select('*')
            .eq('tipo', 'formulario')
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data?.dados || {};
    } catch (error) {
        console.error('Erro ao buscar configuração:', error);
        return JSON.parse(localStorage.getItem('admin_form_data') || '{}');
    }
}

// Salvar comentários
async function saveComments(comments) {
    try {
        const db = await getSupabase();
        if (!db) {
            localStorage.setItem('admin_comentarios', JSON.stringify(comments));
            return true;
        }

        const { error } = await db
            .from('configuracoes')
            .upsert({
                id: 2,
                tipo: 'comentarios',
                dados: comments,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Erro ao salvar comentários:', error);
        localStorage.setItem('admin_comentarios', JSON.stringify(comments));
        return false;
    }
}

// Buscar comentários
async function getComments() {
    try {
        const db = await getSupabase();
        if (!db) {
            return JSON.parse(localStorage.getItem('admin_comentarios') || '{}');
        }

        const { data, error } = await db
            .from('configuracoes')
            .select('*')
            .eq('tipo', 'comentarios')
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data?.dados || {};
    } catch (error) {
        console.error('Erro ao buscar comentários:', error);
        return JSON.parse(localStorage.getItem('admin_comentarios') || '{}');
    }
}

// ============ FALLBACK LOCALSTORAGE ============

function saveParticipantLocalStorage(nome, celular) {
    const registrationData = {
        nome: nome,
        celular: celular,
        timestamp: new Date().toISOString(),
        device: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop'
    };

    localStorage.setItem('webinar_registration', JSON.stringify(registrationData));

    let participantes = JSON.parse(localStorage.getItem('webinar_participantes') || '[]');
    const phoneOnly = celular.replace(/\D/g, '');
    const alreadyExists = participantes.some(p => p.celular.replace(/\D/g, '') === phoneOnly);

    if (!alreadyExists) {
        participantes.push(registrationData);
        localStorage.setItem('webinar_participantes', JSON.stringify(participantes));
    }

    return registrationData;
}

