// Get user registration data
let userName = 'Visitante';
let userPhone = '';
const registrationData = localStorage.getItem('webinar_registration');
if (registrationData) {
    try {
        const data = JSON.parse(registrationData);
        userName = data.nome || 'Visitante';
        userPhone = data.celular || '';
        console.log('📝 Dados de registro carregados:', { nome: userName, celular: userPhone });
    } catch (e) {
        console.error('Error parsing registration data:', e);
    }
} else {
    console.warn('⚠️ Nenhum registro encontrado no localStorage');
}

// Update greeting with user name
const greetingElement = document.querySelector('.greeting-bar span');
if (greetingElement) {
    greetingElement.textContent = `Olá, ${userName}`;
}

// Função de teste para verificar ganhadores (disponível no console)
window.testWinner = async function() {
    console.log('🧪 Testando verificação de ganhador...');
    console.log('📱 Celular do usuário:', userPhone);
    console.log('📱 Celular normalizado:', (userPhone || '').replace(/\D/g, ''));
    
    const winners = JSON.parse(localStorage.getItem('webinar_winners') || '[]');
    console.log('🏆 Ganhadores salvos:', winners);
    
    const isWinner = await checkIfWinnerWrapper();
    console.log('✅ É ganhador?', isWinner);
    
    if (isWinner) {
        await showWinnerModal();
        console.log('🎉 Modal de ganhador deve aparecer agora!');
    } else {
        console.log('❌ Não é ganhador ou não encontrado');
    }
    
    return isWinner;
};

// Check if user is a winner (wrapper function)
async function checkIfWinnerWrapper() {
    console.log('========================================');
    console.log('🔍 INICIANDO VERIFICAÇÃO DE GANHADOR');
    console.log('========================================');
    
    if (!userPhone) {
        console.error('❌ ERRO: userPhone não definido!', userPhone);
        console.log('📝 Dados do localStorage:', localStorage.getItem('webinar_registration'));
        return false;
    }
    
    const userPhoneNormalized = userPhone.replace(/\D/g, '');
    console.log('📱 Celular do usuário FORMATADO:', userPhone);
    console.log('📱 Celular do usuário NORMALIZADO:', userPhoneNormalized);
    
    // Primeiro verifica localStorage (mais rápido e funciona sempre)
    try {
        const winnersStr = localStorage.getItem('webinar_winners') || '[]';
        console.log('📦 String de ganhadores:', winnersStr);
        const localWinners = JSON.parse(winnersStr);
        console.log('📦 Total de ganhadores no localStorage:', localWinners.length);
        
        if (localWinners.length > 0) {
            console.log('📋 LISTA COMPLETA DE GANHADORES:');
            localWinners.forEach((w, idx) => {
                const winPhoneNorm = (w.celular || '').replace(/\D/g, '');
                console.log(`  ${idx + 1}. ${w.nome} - Celular: "${w.celular}" (normalizado: "${winPhoneNorm}")`);
                console.log(`     Comparação: "${winPhoneNorm}" === "${userPhoneNormalized}" ? ${winPhoneNorm === userPhoneNormalized}`);
            });
            
            const isWinnerLocal = localWinners.some(winner => {
                const winnerPhoneNormalized = (winner.celular || '').replace(/\D/g, '');
                const matches = winnerPhoneNormalized === userPhoneNormalized;
                if (matches) {
                    console.log('✅✅✅ MATCH ENCONTRADO! ✅✅✅');
                    console.log('   Ganhador:', winner.nome);
                    console.log('   Celular original:', winner.celular);
                    console.log('   Celular normalizado:', winnerPhoneNormalized);
                }
                return matches;
            });
            
            if (isWinnerLocal) {
                console.log('🎉🎉🎉 É GANHADOR! (verificado via localStorage) 🎉🎉🎉');
                console.log('========================================');
                return true;
            } else {
                console.log('❌ NÃO é ganhador - nenhum match encontrado');
                console.log('   Comparando:', userPhoneNormalized, 'com os ganhadores acima');
            }
        } else {
            console.log('⚠️ Nenhum ganhador no localStorage ainda');
        }
    } catch (error) {
        console.error('❌ ERRO ao verificar localStorage:', error);
    }
    
    // Depois verifica Supabase (fallback)
    try {
        const isWinnerDB = await checkIfWinner(userPhone);
        if (isWinnerDB) {
            console.log('✅ Ganhador encontrado no Supabase!');
            // Salvar no localStorage para próxima vez
            const winners = await getWinners();
            localStorage.setItem('webinar_winners', JSON.stringify(winners));
            return true;
        }
    } catch (error) {
        console.error('Erro ao verificar Supabase:', error);
    }
    
    console.log('❌ Não é ganhador - verificação completa');
    console.log('========================================');
    return false;
}

// Load winner message configuration
let winnerMessageConfig = null;

async function loadWinnerMessageConfig() {
    try {
        if (typeof getWinnerMessageConfig === 'function') {
            winnerMessageConfig = await getWinnerMessageConfig();
        } else {
            // Fallback para localStorage
            const stored = localStorage.getItem('admin_winner_message');
            if (stored) {
                winnerMessageConfig = JSON.parse(stored);
            } else {
                // Configuração padrão
                winnerMessageConfig = {
                    titulo: 'PARABÉNS!',
                    subtitulo: 'Você Ganhou o iPhone!',
                    mensagem: 'Você foi selecionado(a) como um dos ganhadores do sorteio!',
                    detalhes: 'Entre em contato conosco para receber seu prêmio!',
                    botaoTexto: 'Resgatar Prêmio',
                    botaoLink: '#'
                };
            }
        }
    } catch (error) {
        console.error('Erro ao carregar configuração de mensagem:', error);
        // Usar padrão em caso de erro
        winnerMessageConfig = {
            titulo: 'PARABÉNS!',
            subtitulo: 'Você Ganhou o iPhone!',
            mensagem: 'Você foi selecionado(a) como um dos ganhadores do sorteio!',
            detalhes: 'Entre em contato conosco para receber seu prêmio!',
            botaoTexto: 'Resgatar Prêmio',
            botaoLink: '#'
        };
    }
}

// Show winner modal
async function showWinnerModal() {
    // Carregar configuração se ainda não foi carregada
    if (!winnerMessageConfig) {
        await loadWinnerMessageConfig();
    }
    
    // Aplicar configurações ao modal
    const tituloEl = document.getElementById('winner-title');
    const subtituloEl = document.getElementById('winner-subtitle');
    const mensagemEl = document.getElementById('winner-message');
    const detalhesEl = document.getElementById('winner-details-text');
    const resgateBtn = document.getElementById('winner-resgate-btn');
    
    if (tituloEl && winnerMessageConfig) {
        tituloEl.textContent = winnerMessageConfig.titulo || 'PARABÉNS!';
    }
    if (subtituloEl && winnerMessageConfig) {
        subtituloEl.textContent = winnerMessageConfig.subtitulo || 'Você Ganhou o iPhone!';
    }
    if (mensagemEl && winnerMessageConfig) {
        mensagemEl.textContent = winnerMessageConfig.mensagem || 'Você foi selecionado(a) como um dos ganhadores do sorteio!';
    }
    if (detalhesEl && winnerMessageConfig) {
        detalhesEl.textContent = winnerMessageConfig.detalhes || 'Entre em contato conosco para receber seu prêmio!';
    }
    if (resgateBtn && winnerMessageConfig) {
        resgateBtn.textContent = winnerMessageConfig.botaoTexto || 'Resgatar Prêmio';
        resgateBtn.href = winnerMessageConfig.botaoLink || '#';
    }
    
    const modal = document.getElementById('winner-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

// Hide winner modal
function hideWinnerModal() {
    const modal = document.getElementById('winner-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Check for winners periodically and on load
let forceCheck = false; // Flag para forçar verificação mesmo se já foi mostrado

async function checkWinnerStatus(force = false) {
    console.log('🔔 checkWinnerStatus chamado!', force ? '(FORÇADO)' : '');
    try {
        const isWinner = await checkIfWinnerWrapper();
        console.log('🎯 Resultado da verificação:', isWinner ? 'É GANHADOR!' : 'NÃO é ganhador');
        
        if (isWinner) {
            const phoneKey = (userPhone || '').replace(/\D/g, '');
            const alreadyShown = localStorage.getItem('winner_shown_' + phoneKey);
            console.log('📌 Modal já foi mostrado?', alreadyShown ? 'SIM' : 'NÃO');
            
            // Se for forçado ou se ainda não foi mostrado, mostrar
            if (force || !alreadyShown) {
                console.log('🎉🎉🎉 MOSTRANDO MODAL DE GANHADOR! 🎉🎉🎉', force ? '(FORÇADO)' : '');
                await showWinnerModal();
                localStorage.setItem('winner_shown_' + phoneKey, 'true');
                console.log('✅ Modal exibido e flag salvo!');
            } else {
                console.log('ℹ️ Modal já foi mostrado anteriormente (pulando)');
            }
        } else {
            console.log('ℹ️ Não é ganhador, não mostrando modal');
        }
    } catch (error) {
        console.error('❌ ERRO ao verificar status de ganhador:', error);
    }
}

// Função global de debug para testar manualmente
window.debugWinner = async function() {
    console.log('🧪 === TESTE MANUAL DE GANHADOR ===');
    console.log('📱 userPhone:', userPhone);
    console.log('📦 Ganhadores:', JSON.parse(localStorage.getItem('webinar_winners') || '[]'));
    await checkWinnerStatus(true);
};

// Load offer configuration
let offerConfig = null;

async function loadOfferConfig() {
    try {
        if (typeof getOfferConfig === 'function') {
            offerConfig = await getOfferConfig();
        } else {
            // Fallback para localStorage
            const stored = localStorage.getItem('admin_offer_config');
            if (stored) {
                offerConfig = JSON.parse(stored);
            } else {
                // Configuração padrão
                offerConfig = {
                    icon: '🔥',
                    titulo: 'Oferta Especial',
                    subtitulo: 'Aproveite Agora!',
                    mensagem: 'Não perca esta oportunidade única!',
                    detalhes: 'Confira nossa oferta especial!',
                    ctaTexto: 'Quero Aproveitar',
                    ctaLink: '#'
                };
            }
        }
    } catch (error) {
        console.error('Erro ao carregar configuração de oferta:', error);
        offerConfig = {
            icon: '🔥',
            titulo: 'Oferta Especial',
            subtitulo: 'Aproveite Agora!',
            mensagem: 'Não perca esta oportunidade única!',
            detalhes: 'Confira nossa oferta especial!',
            ctaTexto: 'Quero Aproveitar',
            ctaLink: '#'
        };
    }
}

// Show offer popup - VERSÃO SIMPLIFICADA E FORÇADA
async function showOfferPopup() {
    console.log('🔥🔥🔥 MOSTRANDO POPUP DE OFERTA! 🔥🔥🔥');
    
    // Carregar configuração se ainda não foi carregada
    if (!offerConfig) {
        console.log('📦 Carregando configuração de oferta...');
        await loadOfferConfig();
        console.log('✅ Configuração carregada:', offerConfig);
    }
    
    // Aplicar configurações ao modal
    const iconEl = document.getElementById('offer-icon');
    const titleEl = document.getElementById('offer-title');
    const subtitleEl = document.getElementById('offer-subtitle');
    const messageEl = document.getElementById('offer-message');
    const detailsEl = document.getElementById('offer-details-text');
    const ctaBtn = document.getElementById('offer-cta-btn');
    
    // Aplicar textos mesmo sem config (valores padrão)
    if (iconEl) iconEl.textContent = (offerConfig && offerConfig.icon) || '🔥';
    if (titleEl) titleEl.textContent = (offerConfig && offerConfig.titulo) || 'Oferta Especial';
    if (subtitleEl) subtitleEl.textContent = (offerConfig && offerConfig.subtitulo) || 'Aproveite Agora!';
    if (messageEl) messageEl.textContent = (offerConfig && offerConfig.mensagem) || 'Não perca esta oportunidade única!';
    if (detailsEl) detailsEl.textContent = (offerConfig && offerConfig.detalhes) || 'Confira nossa oferta especial!';
    if (ctaBtn) {
        ctaBtn.textContent = (offerConfig && offerConfig.ctaTexto) || 'Quero Aproveitar';
        ctaBtn.href = (offerConfig && offerConfig.ctaLink) || '#';
    }
    
    // FORÇAR EXIBIÇÃO DO MODAL - MÚLTIPLAS FORMAS
    const modal = document.getElementById('offer-modal');
    if (modal) {
        console.log('✅ Modal encontrado!');
        
        // Método 1: Adicionar classe
        modal.classList.add('show');
        
        // Método 2: Forçar display diretamente (fallback)
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.style.zIndex = '9999';
        
        console.log('✅ Popup FORÇADO a aparecer!');
        console.log('   Classes:', modal.className);
        console.log('   Display:', window.getComputedStyle(modal).display);
        console.log('   Visibility:', window.getComputedStyle(modal).visibility);
    } else {
        console.error('❌ ERRO CRÍTICO: Modal não encontrado!');
        alert('ERRO: Modal de oferta não encontrado. Recarregue a página.');
    }
}

// Hide offer popup - VERSÃO FORÇADA
function hideOfferPopup() {
    const modal = document.getElementById('offer-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
        console.log('✅ Popup de oferta fechado');
    }
}

// Load video configuration
async function loadVideoEmbed() {
    try {
        if (typeof getVideoConfig === 'function') {
            const config = await getVideoConfig();
            const videoContainer = document.getElementById('video-container');
            if (videoContainer && config.embedCode) {
                videoContainer.innerHTML = config.embedCode;
                console.log('✅ Vídeo embed carregado:', config.embedCode.substring(0, 50) + '...');
            }
        } else {
            // Fallback para localStorage
            const stored = localStorage.getItem('admin_video_config');
            if (stored) {
                const config = JSON.parse(stored);
                const videoContainer = document.getElementById('video-container');
                if (videoContainer && config.embedCode) {
                    videoContainer.innerHTML = config.embedCode;
                }
            }
        }
    } catch (error) {
        console.error('Erro ao carregar configuração de vídeo:', error);
    }
}

// Check on page load (async)
(async function() {
    // Aguardar um pouco para garantir que tudo carregou
    await new Promise(resolve => setTimeout(resolve, 1000));
    await loadOfferConfig(); // Carregar configuração de oferta
    await loadVideoEmbed();
    await checkWinnerStatus();
    
    console.log('✅ Sistema carregado completamente');
    console.log('💡 Funções disponíveis: testOffer(), debugWinner()');
})();

// Listen for admin winner confirmations (same tab)
window.addEventListener('winners-confirmed', async function(e) {
    console.log('========================================');
    console.log('🎉🎉🎉 EVENTO WINNERS-CONFIRMED RECEBIDO! 🎉🎉🎉');
    console.log('Detalhes:', e.detail);
    console.log('========================================');
    // Verificação IMEDIATA - FORÇADA (ignora se já foi mostrado)
    if (e.detail.timestamp) {
        lastWinnersTimestamp = e.detail.timestamp.toString();
    }
    await checkWinnerStatus(e.detail.force !== false); // TRUE = força mostrar mesmo se já foi exibido
});

// Listen for storage changes (cross-tab)
window.addEventListener('storage', async function(e) {
    if (e.key === 'webinar_winners' || e.key === 'webinar_winners_timestamp') {
        console.log('========================================');
        console.log('📢 STORAGE EVENT RECEBIDO!');
        console.log('Key:', e.key);
        console.log('New Value:', e.newValue);
        console.log('========================================');
        // Atualizar timestamp local
        if (e.key === 'webinar_winners_timestamp') {
            lastWinnersTimestamp = e.newValue || '0';
            // Se timestamp mudou, é uma nova confirmação - FORÇAR mostrar
            await checkWinnerStatus(true);
        } else if (e.key === 'webinar_winners') {
            // Se ganhadores mudaram, verificar (mas não forçar - pode ser revalidação)
            await checkWinnerStatus();
        }
    }
});

// Monitorar mudanças no localStorage usando timestamp
let lastWinnersTimestamp = localStorage.getItem('webinar_winners_timestamp') || '0';

function checkWinnersUpdate() {
    const currentTimestamp = localStorage.getItem('webinar_winners_timestamp') || '0';
    if (currentTimestamp !== lastWinnersTimestamp) {
        console.log('🔄 Detecada atualização de ganhadores! Verificando...');
        lastWinnersTimestamp = currentTimestamp;
        checkWinnerStatus();
    }
}

// Check when localStorage changes (for same-tab) - método melhorado
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    if (key === 'webinar_winners') {
        console.log('📢 localStorage.winners atualizado, verificando IMEDIATAMENTE...');
        // Verificação IMEDIATA - sem setTimeout
        checkWinnerStatus();
    }
    if (key === 'webinar_winners_timestamp') {
        checkWinnersUpdate();
    }
};

// Usar BroadcastChannel para comunicação entre abas (mais confiável)
try {
    const winnerChannel = new BroadcastChannel('winner-notifications');
    winnerChannel.addEventListener('message', async function(e) {
        if (e.data && e.data.type === 'winners-updated') {
            console.log('========================================');
            console.log('📢📢📢 BROADCASTCHANNEL RECEBIDO! 📢📢📢');
            console.log('Dados:', e.data);
            console.log('========================================');
            // Atualizar timestamp local IMEDIATAMENTE
            if (e.data.timestamp) {
                lastWinnersTimestamp = e.data.timestamp.toString();
            }
            // Forçar verificação IMEDIATA - FORÇADA (mostra mesmo se já foi exibido antes)
            await checkWinnerStatus(true);
        }
    });
    console.log('✅ BroadcastChannel configurado e pronto');
} catch (e) {
    console.warn('BroadcastChannel não disponível, usando fallback:', e);
}

// Check periodically (backup mais frequente quando há ganhadores)
let checkInterval = setInterval(async () => {
    // Verificar se há ganhadores primeiro (para polling mais eficiente)
    const winners = JSON.parse(localStorage.getItem('webinar_winners') || '[]');
    if (winners.length > 0) {
        // Se há ganhadores, verificar mais frequentemente
        checkWinnersUpdate();
        await checkWinnerStatus();
    }
}, 1000); // A cada 1 segundo (MUITO mais frequente para garantir)

// Close button - attach event listener
setTimeout(() => {
    const closeBtn = document.getElementById('winner-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideWinnerModal);
    }
    
    // Offer popup close buttons
    const offerCloseX = document.getElementById('offer-close-btn');
    const offerCloseBottom = document.getElementById('offer-close-bottom-btn');
    if (offerCloseX) {
        offerCloseX.addEventListener('click', hideOfferPopup);
        console.log('✅ Botão X de fechar oferta configurado');
    }
    if (offerCloseBottom) {
        offerCloseBottom.addEventListener('click', hideOfferPopup);
        console.log('✅ Botão inferior de fechar oferta configurado');
    }
}, 100);

// Configurar listeners ANTES de tudo (garantir que estão prontos)
(function() {
    // Listen for offer popup events (mesma aba) - MÚLTIPLOS LISTENERS
    const handler1 = async function(e) {
        console.log('========================================');
        console.log('🔥🔥🔥 EVENTO SHOW-OFFER-POPUP RECEBIDO! 🔥🔥🔥');
        console.log('Detalhes:', e.detail);
        console.log('========================================');
        await showOfferPopup();
    };
    window.addEventListener('show-offer-popup', handler1);
    document.addEventListener('show-offer-popup', handler1); // Backup

    // Listen for BroadcastChannel offer popup (outras abas)
    try {
        const offerChannel = new BroadcastChannel('offer-popup');
        offerChannel.addEventListener('message', async function(e) {
            if (e.data && e.data.type === 'show-offer') {
                console.log('========================================');
                console.log('🔥🔥🔥 BROADCASTCHANNEL: MOSTRAR OFERTA! 🔥🔥🔥');
                console.log('Dados:', e.data);
                console.log('========================================');
                await showOfferPopup();
            }
        });
        console.log('✅ BroadcastChannel de oferta configurado e pronto');
    } catch (e) {
        console.warn('❌ BroadcastChannel de oferta não disponível:', e);
    }
    
    console.log('✅ Listeners de oferta configurados');
})();

// Função global para testar manualmente
window.testOffer = async function() {
    console.log('🧪 Testando popup de oferta manualmente...');
    await showOfferPopup();
};

// Timer functionality
let streamStartTime = Date.now();

function updateTimer() {
    const elapsed = Date.now() - streamStartTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    const formattedTime = 
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0');
    
    document.getElementById('stream-timer').textContent = formattedTime;
}

// Update timer every second
setInterval(updateTimer, 1000);

// Viewers count simulation
let viewersCount = 1000;

function updateViewersCount() {
    // Simulate realistic viewer count variations
    // Sometimes people join, sometimes they leave
    const random = Math.random();
    
    // 60% chance of small change (-3 to +5)
    // 30% chance of medium change (-8 to +12)
    // 10% chance of larger change (-15 to +20)
    let change;
    if (random < 0.6) {
        change = Math.floor(Math.random() * 9) - 3; // -3 to +5
    } else if (random < 0.9) {
        change = Math.floor(Math.random() * 21) - 8; // -8 to +12
    } else {
        change = Math.floor(Math.random() * 36) - 15; // -15 to +20
    }
    
    // Keep count between 850 and 1200 for realism
    viewersCount = Math.max(850, Math.min(1200, viewersCount + change));
    document.getElementById('viewers-count').textContent = viewersCount.toLocaleString('pt-BR');
}

// Update viewers count every 3-8 seconds for more dynamic feel
setInterval(updateViewersCount, Math.random() * 5000 + 3000);

// Chat functionality
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');

// Load admin comments
function getAdminComments() {
    const comentarios = JSON.parse(localStorage.getItem('admin_comentarios') || '{}');
    
    const animacao = comentarios.animacao || [
        'Que sorteio incrível! Quero muito ganhar esse iPhone!',
        'Estou participando! Seria um sonho ganhar!',
        'Finalmente um sorteio de verdade! Torcendo muito!',
        'Meu celular está quebrado, seria perfeito ganhar!',
        'iPhone é tudo de bom! Estou dentro!'
    ];
    
    const tristes = comentarios.tristes || [
        'Que triste, perdi o sorteio de novo...',
        'Sempre participo mas nunca ganho nada 😢',
        'Parece que não é pra mim mesmo...',
        'Mais um sorteio que vou perder, certeza',
        'Já desisti de ganhar alguma coisa'
    ];
    
    return { animacao, tristes };
}

// Get random participant names for messages (for automatic messages only)
const automaticNames = ['Maria', 'João', 'Ana', 'Pedro', 'Julia', 'Carlos', 'Fernanda', 'Lucas', 'Beatriz', 'Rafael', 'Mariana', 'Bruno'];

function getRandomParticipantName() {
    const participantes = JSON.parse(localStorage.getItem('webinar_participantes') || '[]');
    if (participantes.length > 0) {
        const random = participantes[Math.floor(Math.random() * participantes.length)];
        return random.nome.split(' ')[0]; // First name only
    }
    return automaticNames[Math.floor(Math.random() * automaticNames.length)];
}

// Process pending messages from admin
function processPendingMessages() {
    const pendingMessages = JSON.parse(localStorage.getItem('webinar_pending_messages') || '[]');
    
    if (pendingMessages.length > 0) {
        const now = Date.now();
        const messagesToShow = pendingMessages.filter(msg => msg.timestamp <= now);
        
        messagesToShow.forEach(msg => {
            addChatMessage(msg.username, msg.message);
        });
        
        // Remove processed messages
        const remainingMessages = pendingMessages.filter(msg => msg.timestamp > now);
        localStorage.setItem('webinar_pending_messages', JSON.stringify(remainingMessages));
    }
}

// Listen for admin actions
window.addEventListener('admin-messages-added', function() {
    processPendingMessages();
});

window.addEventListener('admin-clear-chat', function() {
    chatMessages.innerHTML = '';
});

// Listen for winners confirmation (same tab)
window.addEventListener('winners-confirmed', async function(e) {
    await checkWinnerStatus();
});

// Listen for storage changes (cross-tab and same-tab trigger)
window.addEventListener('storage', async function(e) {
    if (e.key === 'webinar_winners' || e.key === 'webinar_winners_timestamp') {
        await checkWinnerStatus();
    }
});

// Also check when localStorage changes (for same-tab)
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    if (key === 'webinar_winners') {
        checkWinnerStatus();
    }
};

// Check for pending messages every second
setInterval(processPendingMessages, 1000);

// Add admin-controlled messages periodically (automatic)
let messageType = 'animacao'; // Alternate between animacao and tristes
function addAdminMessage() {
    const comentarios = getAdminComments();
    const activeComentarios = comentarios[messageType];
    
    if (activeComentarios && activeComentarios.length > 0) {
        const randomMessage = activeComentarios[Math.floor(Math.random() * activeComentarios.length)];
        const randomName = getRandomParticipantName();
        addChatMessage(randomName, randomMessage);
    }
    
    // Alternate message type
    messageType = messageType === 'animacao' ? 'tristes' : 'animacao';
}

// Start adding admin messages every 15-25 seconds (less frequent, admin has control)
setTimeout(() => {
    setInterval(addAdminMessage, Math.random() * 10000 + 15000);
}, 5000);

function addChatMessage(username, message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    
    const usernameSpan = document.createElement('span');
    usernameSpan.className = 'username';
    usernameSpan.textContent = username + ':';
    
    const textSpan = document.createElement('span');
    textSpan.className = 'message-text';
    textSpan.textContent = ' ' + message;
    
    messageDiv.appendChild(usernameSpan);
    messageDiv.appendChild(textSpan);
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send message function
function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
        // In a real app, this would send to a server via WebSocket
        addChatMessage(userName, message);
        chatInput.value = '';
        
        // Simulate other users responding occasionally
        if (Math.random() > 0.7) {
            setTimeout(() => {
                const responses = ['Ótima pergunta!', 'Sim!', 'Perfeito!', 'Concordo!'];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                addChatMessage('Sistema', randomResponse);
            }, 2000);
        }
    }
}

// Event listeners
if (sendButton) {
    sendButton.addEventListener('click', sendMessage);
}

if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// Close winner modal button
const winnerCloseBtn = document.getElementById('winner-close-btn');
if (winnerCloseBtn) {
    winnerCloseBtn.addEventListener('click', hideWinnerModal);
}

// Auto-scroll chat to bottom on load
if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
