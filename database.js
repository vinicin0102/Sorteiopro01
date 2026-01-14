// Database Functions - Supabase Integration

// Wait for Supabase to be loaded
async function getSupabase() {
    // Se já foi inicializado (vem do config.js), retorna
    if (window.supabaseClient) {
        return window.supabaseClient;
    }

    // Tenta inicializar
    try {
        // Chama a função de inicialização se existir
        if (typeof window.initSupabase === 'function') {
            window.initSupabase();
            if (window.supabaseClient) {
                return window.supabaseClient;
            }
        }

        // Tentar diretamente também
        let supabaseLib = null;
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            supabaseLib = supabase;
        } else if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            supabaseLib = window.supabase;
        }

        if (supabaseLib && supabaseLib.createClient) {
            window.supabaseClient = supabaseLib.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
            console.log('✅ Supabase inicializado em getSupabase()');
            return window.supabaseClient;
        }
    } catch (error) {
        console.error('❌ Erro ao inicializar Supabase em getSupabase():', error);
    }

    console.warn('⚠️ Supabase não disponível, usando fallback localStorage');
    return null;
}

// ============ PARTICIPANTES ============

// Salvar participante
async function saveParticipant(nome, celular) {
    const phoneOnly = celular.replace(/\D/g, '');
    const registrationData = {
        nome: nome,
        celular: celular,
        celular_normalizado: phoneOnly,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        device: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop'
    };

    // SEMPRE salvar no localStorage primeiro (backup garantido)
    try {
        let participantes = JSON.parse(localStorage.getItem('webinar_participantes') || '[]');
        const alreadyExists = participantes.some(p => (p.celular || '').replace(/\D/g, '') === phoneOnly);

        if (!alreadyExists) {
            participantes.push(registrationData);
            localStorage.setItem('webinar_participantes', JSON.stringify(participantes));
            console.log('✅ Participante salvo no localStorage:', nome);
        } else {
            // Atualizar se já existe
            participantes = participantes.map(p => {
                if ((p.celular || '').replace(/\D/g, '') === phoneOnly) {
                    return { ...p, nome: nome, celular: celular, updated_at: new Date().toISOString() };
                }
                return p;
            });
            localStorage.setItem('webinar_participantes', JSON.stringify(participantes));
            console.log('✅ Participante atualizado no localStorage:', nome);
        }
    } catch (e) {
        console.warn('Erro ao salvar no localStorage:', e);
    }

    try {
        const db = await getSupabase();
        if (!db) {
            console.warn('⚠️ Supabase não disponível, usando apenas localStorage');
            return registrationData;
        }

        // Verificar se já existe no Supabase
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
            console.log('✅ Participante atualizado no Supabase:', nome);
            return data;
        }

        // Criar novo no Supabase
        const { data, error } = await db
            .from('participantes')
            .insert({
                nome: nome,
                celular: celular,
                celular_normalizado: phoneOnly,
                device: registrationData.device,
                created_at: registrationData.created_at
            })
            .select()
            .single();

        if (error) throw error;

        console.log('✅ Participante salvo no Supabase:', nome);

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
        console.error('Erro ao salvar no Supabase:', error);
        // Já salvou no localStorage, então retorna os dados locais
        return registrationData;
    }
}


// Buscar todos os participantes
async function getAllParticipants() {
    try {
        const db = await getSupabase();

        // Sempre buscar do localStorage primeiro (dados mais recentes)
        const localData = JSON.parse(localStorage.getItem('webinar_participantes') || '[]');
        console.log(`Participantes no localStorage: ${localData.length}`);

        if (!db) {
            console.log('⚠️ Supabase não disponível, usando apenas localStorage');
            return localData;
        }

        console.log('🔍 Buscando participantes do Supabase...');
        const { data, error } = await db
            .from('participantes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Erro ao buscar participantes do Supabase:', error);
            console.log('📦 Usando fallback localStorage...');
            return localData;
        }

        console.log(`✅ Participantes encontrados no Supabase: ${data?.length || 0}`);

        // Mesclar dados do Supabase com localStorage (evitar duplicatas)
        const supabaseData = data || [];
        const merged = [...supabaseData];

        // Adicionar participantes do localStorage que não estão no Supabase
        localData.forEach(localParticipant => {
            const phoneOnly = (localParticipant.celular || '').replace(/\D/g, '');
            const exists = merged.some(p => {
                const pPhone = (p.celular || '').replace(/\D/g, '');
                return pPhone === phoneOnly;
            });

            if (!exists) {
                console.log(`➕ Adicionando participante do localStorage: ${localParticipant.nome}`);
                merged.push(localParticipant);
            }
        });

        console.log(`📊 Total de participantes após mesclar: ${merged.length}`);
        return merged;
    } catch (error) {
        console.error('❌ Erro ao buscar participantes:', error);
        console.log('📦 Usando fallback localStorage...');
        const localData = JSON.parse(localStorage.getItem('webinar_participantes') || '[]');
        console.log(`📊 Participantes no localStorage: ${localData.length}`);
        return localData;
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
        console.log('💾 saveWinners chamado com:', winners);

        // Normalizar os dados antes de salvar
        const normalizedForSave = winners.map(w => ({
            nome: w.nome || '',
            celular: w.celular || '',
            celular_normalizado: (w.celular || '').replace(/\D/g, ''),
            id: w.id || null,
            participante_id: w.participante_id || w.id || null
        }));

        console.log('💾 Dados normalizados para salvar:', normalizedForSave);

        // Sempre salvar no localStorage primeiro para trigger imediato
        const oldWinners = localStorage.getItem('webinar_winners');
        localStorage.setItem('webinar_winners', JSON.stringify(normalizedForSave));
        const timestamp = Date.now().toString();
        localStorage.setItem('webinar_winners_timestamp', timestamp);

        console.log('✅ Salvo no localStorage:', {
            ganhadores: normalizedForSave.length,
            timestamp: timestamp,
            dados: normalizedForSave
        });

        // Disparar evento de storage para outras abas
        try {
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'webinar_winners',
                newValue: JSON.stringify(normalizedForSave),
                oldValue: oldWinners
            }));
            console.log('✅ StorageEvent disparado');
        } catch (e) {
            console.warn('Erro ao disparar StorageEvent:', e);
        }

        const db = await getSupabase();
        if (!db) {
            console.log('⚠️ Supabase não disponível, salvando apenas em localStorage');
            return true;
        }

        // Limpar ganhadores anteriores (usar filtro que sempre retorna algo)
        try {
            const { data: existing } = await db.from('ganhadores').select('id');
            if (existing && existing.length > 0) {
                const { error: deleteError } = await db.from('ganhadores').delete().gte('id', 0);
                if (deleteError) {
                    console.warn('Aviso ao limpar ganhadores anteriores:', deleteError);
                }
            }
        } catch (delError) {
            console.warn('Aviso ao verificar/limpar ganhadores anteriores:', delError);
        }

        // Inserir novos ganhadores
        if (winners.length > 0) {
            const winnersData = winners.map(winner => ({
                participante_id: winner.id || null,
                nome: winner.nome || '',
                celular: winner.celular || ''
            }));

            const { error } = await db.from('ganhadores').insert(winnersData);
            if (error) {
                console.error('Erro ao salvar ganhadores no Supabase:', error);
                console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
                // Não retorna false porque já salvou no localStorage
            } else {
                console.log('✅ Ganhadores salvos no Supabase:', winners.length);
            }
        }

        return true;
    } catch (error) {
        console.error('Erro ao salvar ganhadores:', error);
        // Já salvou no localStorage, então retorna true
        return true;
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

        if (error) {
            console.warn('Erro ao buscar ganhadores do Supabase:', error);
            // Não lançar erro, retornar localStorage em vez disso
        }
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

// Salvar configurações de vídeo
async function saveVideoConfig(config) {
    try {
        const db = await getSupabase();
        if (!db) {
            localStorage.setItem('admin_video_config', JSON.stringify(config));
            return true;
        }

        const { error } = await db
            .from('configuracoes')
            .upsert({
                id: 4,
                tipo: 'video',
                dados: config,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Erro ao salvar configuração de vídeo:', error);
        localStorage.setItem('admin_video_config', JSON.stringify(config));
        return false;
    }
}

// Buscar configurações de vídeo
async function getVideoConfig() {
    try {
        const db = await getSupabase();
        const defaultConfig = {
            embedCode: '', // Sem vídeo padrão
            offerTriggerSeconds: 0 // Tempo em segundos para disparo automático (0 = desativado)
        };

        if (!db) {
            return JSON.parse(localStorage.getItem('admin_video_config') || JSON.stringify(defaultConfig));
        }

        const { data, error } = await db
            .from('configuracoes')
            .select('*')
            .eq('tipo', 'video')
            .maybeSingle();

        if (error) {
            if (error.code !== 'PGRST116') {
                console.warn('Aviso ao buscar configuração de vídeo:', error);
            }
        }

        if (data?.dados) {
            // Mesclar com defaults para garantir que todos os campos existam
            return {
                ...defaultConfig,
                ...data.dados
            };
        }

        return defaultConfig;
    } catch (error) {
        console.error('Erro ao buscar configuração de vídeo:', error);
        const defaultConfig = {
            embedCode: '',
            offerTriggerSeconds: 0
        };
        return JSON.parse(localStorage.getItem('admin_video_config') || JSON.stringify(defaultConfig));
    }
}


// Salvar configurações de popup de oferta
async function saveOfferConfig(config) {
    try {
        const db = await getSupabase();
        if (!db) {
            localStorage.setItem('admin_offer_config', JSON.stringify(config));
            return true;
        }

        const { error } = await db
            .from('configuracoes')
            .upsert({
                id: 5,
                tipo: 'oferta',
                dados: config,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Erro ao salvar configuração de oferta:', error);
        localStorage.setItem('admin_offer_config', JSON.stringify(config));
        return false;
    }
}

// Buscar configurações de popup de oferta
async function getOfferConfig() {
    try {
        const db = await getSupabase();
        if (!db) {
            const defaultConfig = {
                icon: '🔥',
                titulo: 'Oferta Especial',
                subtitulo: 'Aproveite Agora!',
                mensagem: 'Não perca esta oportunidade única!',
                detalhes: 'Confira nossa oferta especial!',
                ctaTexto: 'Quero Aproveitar',
                ctaLink: '#'
            };
            return JSON.parse(localStorage.getItem('admin_offer_config') || JSON.stringify(defaultConfig));
        }

        const { data, error } = await db
            .from('configuracoes')
            .select('*')
            .eq('tipo', 'oferta')
            .maybeSingle();

        if (error) {
            if (error.code !== 'PGRST116') {
                console.warn('Aviso ao buscar configuração de oferta:', error);
            }
        }

        if (data?.dados) {
            return data.dados;
        }

        // Retornar configuração vazia se não existir (sem valores padrão)
        const defaultConfig = {
            icon: '',
            titulo: '',
            subtitulo: '',
            mensagem: '',
            detalhes: '',
            ctaTexto: '',
            ctaLink: ''
        };
        return defaultConfig;
    } catch (error) {
        console.error('Erro ao buscar configuração de oferta:', error);
        const defaultConfig = {
            icon: '',
            titulo: '',
            subtitulo: '',
            mensagem: '',
            detalhes: '',
            ctaTexto: '',
            ctaLink: ''
        };
        return JSON.parse(localStorage.getItem('admin_offer_config') || JSON.stringify(defaultConfig));
    }
}

// Salvar configurações de mensagem de ganhador
async function saveWinnerMessageConfig(config) {
    try {
        const db = await getSupabase();
        if (!db) {
            localStorage.setItem('admin_winner_message', JSON.stringify(config));
            return true;
        }

        const { error } = await db
            .from('configuracoes')
            .upsert({
                id: 3,
                tipo: 'ganhador',
                dados: config,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Erro ao salvar configuração de ganhador:', error);
        localStorage.setItem('admin_winner_message', JSON.stringify(config));
        return false;
    }
}

// Buscar configurações de mensagem de ganhador
async function getWinnerMessageConfig() {
    try {
        const db = await getSupabase();
        if (!db) {
            const defaultConfig = {
                titulo: 'PARABÉNS!',
                subtitulo: 'Você Ganhou o iPhone!',
                mensagem: 'Você foi selecionado(a) como um dos ganhadores do sorteio!',
                detalhes: 'Entre em contato conosco para receber seu prêmio!',
                botaoTexto: 'Resgatar Prêmio',
                botaoLink: '#'
            };
            return JSON.parse(localStorage.getItem('admin_winner_message') || JSON.stringify(defaultConfig));
        }

        const { data, error } = await db
            .from('configuracoes')
            .select('*')
            .eq('tipo', 'ganhador')
            .maybeSingle();

        if (error) {
            // Se for erro de "não encontrado", não é problema
            if (error.code !== 'PGRST116') {
                console.warn('Aviso ao buscar configuração de ganhador:', error);
            }
        }

        if (data?.dados) {
            return data.dados;
        }

        // Retornar configuração padrão se não existir
        const defaultConfig = {
            titulo: 'PARABÉNS!',
            subtitulo: 'Você Ganhou o iPhone!',
            mensagem: 'Você foi selecionado(a) como um dos ganhadores do sorteio!',
            detalhes: 'Entre em contato conosco para receber seu prêmio!',
            botaoTexto: 'Resgatar Prêmio',
            botaoLink: '#'
        };
        return defaultConfig;
    } catch (error) {
        console.error('Erro ao buscar configuração de ganhador:', error);
        const defaultConfig = {
            titulo: 'PARABÉNS!',
            subtitulo: 'Você Ganhou o iPhone!',
            mensagem: 'Você foi selecionado(a) como um dos ganhadores do sorteio!',
            detalhes: 'Entre em contato conosco para receber seu prêmio!',
            botaoTexto: 'Resgatar Prêmio',
            botaoLink: '#'
        };
        return JSON.parse(localStorage.getItem('admin_winner_message') || JSON.stringify(defaultConfig));
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

// ============ LOGS DE ACESSO ADMIN ============

// Salvar log de acesso ao admin
async function saveAdminLoginLog(success, password = null) {
    try {
        const db = await getSupabase();
        if (!db) {
            // Fallback para localStorage
            return saveAdminLoginLogLocalStorage(success, password);
        }

        const logData = {
            success: success,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            device: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
            // Não salvar a senha real por segurança, apenas indicar se foi tentativa
            attempted: password !== null
        };

        const { data, error } = await db
            .from('admin_login_logs')
            .insert([logData])
            .select();

        if (error) {
            console.error('Erro ao salvar log de acesso:', error);
            // Fallback para localStorage
            return saveAdminLoginLogLocalStorage(success, password);
        }

        console.log('✅ Log de acesso salvo:', data);
        return data;
    } catch (error) {
        console.error('Erro ao salvar log de acesso:', error);
        // Fallback para localStorage
        return saveAdminLoginLogLocalStorage(success, password);
    }
}

// Fallback localStorage para logs de acesso
function saveAdminLoginLogLocalStorage(success, password = null) {
    try {
        const logs = JSON.parse(localStorage.getItem('admin_login_logs') || '[]');
        const logData = {
            success: success,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            device: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
            attempted: password !== null
        };

        logs.push(logData);
        // Manter apenas os últimos 100 logs
        if (logs.length > 100) {
            logs.shift();
        }
        localStorage.setItem('admin_login_logs', JSON.stringify(logs));
        console.log('✅ Log de acesso salvo no localStorage');
        return logData;
    } catch (error) {
        console.error('Erro ao salvar log no localStorage:', error);
        return null;
    }
}

// Obter logs de acesso
async function getAdminLoginLogs() {
    try {
        const db = await getSupabase();
        if (!db) {
            // Fallback para localStorage
            const logs = JSON.parse(localStorage.getItem('admin_login_logs') || '[]');
            return logs.reverse(); // Mais recentes primeiro
        }

        const { data, error } = await db
            .from('admin_login_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Erro ao buscar logs de acesso:', error);
            // Fallback para localStorage
            const logs = JSON.parse(localStorage.getItem('admin_login_logs') || '[]');
            return logs.reverse();
        }

        return data || [];
    } catch (error) {
        console.error('Erro ao buscar logs de acesso:', error);
        const logs = JSON.parse(localStorage.getItem('admin_login_logs') || '[]');
        return logs.reverse();
    }
}

// ============ DISPARO DE POPUP DE OFERTA (SUPABASE) ============

// Salvar timestamp de disparo de oferta no Supabase
async function saveOfferPopupTrigger(timestamp) {
    try {
        const db = await getSupabase();

        // Sempre salvar no localStorage também para compatibilidade
        localStorage.setItem('last_offer_popup', timestamp.toString());
        localStorage.setItem('current_offer_disparo_id', timestamp.toString()); // ID único do disparo

        if (!db) {
            console.warn('⚠️ Supabase não disponível, salvando apenas em localStorage');
            return { success: true, disparoId: timestamp };
        }

        // Salvar no Supabase na tabela configuracoes
        const { error } = await db
            .from('configuracoes')
            .upsert({
                id: 6,
                tipo: 'oferta_disparo',
                dados: { timestamp: timestamp, disparo_id: timestamp },
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('❌ Erro ao salvar disparo de oferta no Supabase:', error);
            return { success: false, disparoId: timestamp };
        }

        console.log('✅ Timestamp de disparo salvo no Supabase:', timestamp);
        return { success: true, disparoId: timestamp };
    } catch (error) {
        console.error('❌ Erro ao salvar disparo de oferta:', error);
        return { success: false, disparoId: timestamp };
    }
}

// Buscar timestamp de disparo de oferta do Supabase
async function getOfferPopupTrigger() {
    try {
        const db = await getSupabase();

        // Sempre verificar localStorage primeiro para resposta rápida
        const localTimestamp = localStorage.getItem('last_offer_popup') || '0';

        if (!db) {
            console.warn('⚠️ Supabase não disponível, usando localStorage');
            return parseInt(localTimestamp) || 0;
        }

        // Buscar do Supabase
        const { data, error } = await db
            .from('configuracoes')
            .select('*')
            .eq('tipo', 'oferta_disparo')
            .maybeSingle();

        if (error) {
            if (error.code !== 'PGRST116') {
                console.warn('⚠️ Aviso ao buscar disparo de oferta:', error);
            }
            return parseInt(localTimestamp) || 0;
        }

        if (data?.dados?.timestamp) {
            const supabaseTimestamp = parseInt(data.dados.timestamp) || 0;
            // Atualizar localStorage com o valor do Supabase se for mais recente
            if (supabaseTimestamp > parseInt(localTimestamp)) {
                localStorage.setItem('last_offer_popup', supabaseTimestamp.toString());
            }
            return supabaseTimestamp;
        }

        return parseInt(localTimestamp) || 0;
    } catch (error) {
        console.error('❌ Erro ao buscar disparo de oferta:', error);
        return parseInt(localStorage.getItem('last_offer_popup') || '0') || 0;
    }
}

// Registrar entrega de popup de oferta para um usuário
async function registerOfferDelivery(disparoId, disparoTimestamp, participanteNome = null, participanteCelular = null) {
    try {
        const db = await getSupabase();

        if (!db) {
            console.warn('⚠️ Supabase não disponível, não é possível registrar entrega');
            return false;
        }

        // Verificar se já registrou esta entrega (evitar duplicatas)
        const phoneOnly = participanteCelular ? participanteCelular.replace(/\D/g, '') : null;
        if (phoneOnly) {
            const { data: existing } = await db
                .from('oferta_entregas')
                .select('id')
                .eq('disparo_id', disparoId)
                .eq('participante_celular', phoneOnly)
                .maybeSingle();

            if (existing) {
                console.log('⚠️ Entrega já registrada para este usuário neste disparo');
                return true; // Já registrado, considerar sucesso
            }
        }

        // Registrar entrega
        const { error } = await db
            .from('oferta_entregas')
            .insert({
                disparo_id: disparoId,
                disparo_timestamp: disparoTimestamp,
                participante_nome: participanteNome || null,
                participante_celular: phoneOnly || null,
                user_agent: navigator.userAgent,
                device: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop'
            });

        if (error) {
            console.error('❌ Erro ao registrar entrega de oferta:', error);
            return false;
        }

        console.log('✅ Entrega de oferta registrada no Supabase');
        return true;
    } catch (error) {
        console.error('❌ Erro ao registrar entrega de oferta:', error);
        return false;
    }
}

// Obter contagem de entregas de um disparo específico
async function getOfferDeliveryCount(disparoId) {
    try {
        const db = await getSupabase();

        if (!db) {
            console.warn('⚠️ Supabase não disponível, não é possível obter contagem');
            return 0;
        }

        const { count, error } = await db
            .from('oferta_entregas')
            .select('*', { count: 'exact', head: true })
            .eq('disparo_id', disparoId);

        if (error) {
            console.error('❌ Erro ao obter contagem de entregas:', error);
            return 0;
        }

        return count || 0;
    } catch (error) {
        console.error('❌ Erro ao obter contagem de entregas:', error);
        return 0;
    }
}

// ============ COMENTÁRIOS PROGRAMADOS ============

// Salvar comentários programados
async function saveScheduledComments(comments) {
    try {
        const db = await getSupabase();

        // Sempre salvar no localStorage primeiro
        localStorage.setItem('scheduled_comments', JSON.stringify(comments));
        console.log('✅ Comentários programados salvos no localStorage:', comments.length);

        if (!db) {
            return true;
        }

        const { error } = await db
            .from('configuracoes')
            .upsert({
                id: 6,
                tipo: 'comentarios_programados',
                dados: { comments: comments },
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('Erro ao salvar comentários programados no Supabase:', error);
            // Já salvou no localStorage
        } else {
            console.log('✅ Comentários programados salvos no Supabase:', comments.length);
        }

        return true;
    } catch (error) {
        console.error('Erro ao salvar comentários programados:', error);
        return false;
    }
}

// Buscar comentários programados
async function getScheduledComments() {
    try {
        const db = await getSupabase();

        // Verificar localStorage primeiro
        const localComments = JSON.parse(localStorage.getItem('scheduled_comments') || '[]');

        if (!db) {
            return localComments;
        }

        const { data, error } = await db
            .from('configuracoes')
            .select('*')
            .eq('tipo', 'comentarios_programados')
            .maybeSingle();

        if (error) {
            if (error.code !== 'PGRST116') {
                console.warn('Aviso ao buscar comentários programados:', error);
            }
        }

        if (data?.dados?.comments) {
            const supabaseComments = data.dados.comments;
            // Salvar no localStorage para uso offline
            localStorage.setItem('scheduled_comments', JSON.stringify(supabaseComments));
            return supabaseComments;
        }

        return localComments;
    } catch (error) {
        console.error('Erro ao buscar comentários programados:', error);
        return JSON.parse(localStorage.getItem('scheduled_comments') || '[]');
    }
}
