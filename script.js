// ============================================
// FUNÇÕES GLOBAIS DE TESTE - DEFINIDAS PRIMEIRO
// ============================================
window.testOffer = async function () {
    console.log('🧪🧪🧪 TESTANDO POPUP DE OFERTA MANUALMENTE... 🧪🧪🧪');
    if (typeof showOfferPopup === 'function') {
        await showOfferPopup();
    } else {
        // Forçar exibição direta se função não estiver disponível
        const modal = document.getElementById('offer-modal');
        if (modal) {
            modal.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; z-index: 99999 !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; background: rgba(0, 0, 0, 0.85) !important;';
            console.log('✅ Popup forçado diretamente!');
        } else {
            console.error('❌ Modal não encontrado!');
        }
    }
};

window.showOffer = window.testOffer; // Alias
window.popup = window.testOffer; // Alias

console.log('✅ Funções de teste definidas: testOffer(), showOffer(), popup()');

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
window.testWinner = async function () {
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

// Sistema de ganhadores removido

// Sistema de ganhadores removido - apenas popup de oferta será usado

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

// Auto trigger verification
let offerAutoTriggered = false;

function checkAutoTrigger(currentSeconds) {
    if (!offerConfig || !offerConfig.triggerTime || offerAutoTriggered) return;

    // Convert trigger time string (MM:SS) to seconds
    let triggerSeconds = 0;
    try {
        const parts = offerConfig.triggerTime.split(':');
        triggerSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } catch (e) {
        console.error('Error parsing trigger time:', e);
        return;
    }

    // Check if current time matches or passed trigger time
    if (currentSeconds >= triggerSeconds) {
        console.log('⏰ Auto trigger time reached:', currentSeconds, 'Trigger:', triggerSeconds);
        offerAutoTriggered = true;
        showOfferPopup();
    }
}

// Show offer popup - VERSÃO ULTRA FORÇADA
async function showOfferPopup() {
    console.log('🔥🔥🔥🔥🔥 MOSTRANDO POPUP DE OFERTA! 🔥🔥🔥🔥🔥');

    // Obter ID do disparo atual e timestamp
    const disparoTimestamp = parseInt(localStorage.getItem('last_offer_popup') || '0') || 0;
    const disparoId = parseInt(localStorage.getItem('current_offer_disparo_id') || disparoTimestamp.toString()) || disparoTimestamp;

    // Carregar configuração se ainda não foi carregada
    if (!offerConfig) {
        console.log('📦 Carregando configuração de oferta...');
        await loadOfferConfig();
        console.log('✅ Configuração carregada:', offerConfig);
    }

    // Pequeno delay para garantir que DOM está pronto
    await new Promise(resolve => setTimeout(resolve, 50));

    // Aplicar configurações ao modal - OCULTAR elementos vazios
    const iconEl = document.getElementById('offer-icon');
    const titleEl = document.getElementById('offer-title');
    const subtitleEl = document.getElementById('offer-subtitle');
    const messageEl = document.getElementById('offer-message');
    const detailsEl = document.getElementById('offer-details-text');
    const detailsContainer = document.getElementById('offer-details');
    const ctaBtn = document.getElementById('offer-cta-btn');

    // Aplicar textos e ocultar se estiverem vazios
    if (iconEl) {
        const iconValue = (offerConfig && offerConfig.icon) ? String(offerConfig.icon).trim() : '';
        if (iconValue) {
            iconEl.textContent = iconValue;
            iconEl.style.display = '';
        } else {
            iconEl.style.display = 'none';
        }
    }

    if (titleEl) {
        const titleValue = (offerConfig && offerConfig.titulo) ? String(offerConfig.titulo).trim() : '';
        if (titleValue) {
            titleEl.textContent = titleValue;
            titleEl.style.display = '';
        } else {
            titleEl.style.display = 'none';
        }
    }

    if (subtitleEl) {
        const subtitleValue = (offerConfig && offerConfig.subtitulo) ? String(offerConfig.subtitulo).trim() : '';
        if (subtitleValue) {
            subtitleEl.textContent = subtitleValue;
            subtitleEl.style.display = '';
        } else {
            subtitleEl.style.display = 'none';
        }
    }

    if (messageEl) {
        const messageValue = (offerConfig && offerConfig.mensagem) ? String(offerConfig.mensagem).trim() : '';
        if (messageValue) {
            messageEl.textContent = messageValue;
            messageEl.style.display = '';
        } else {
            messageEl.style.display = 'none';
        }
    }

    if (detailsEl) {
        const detailsValue = (offerConfig && offerConfig.detalhes) ? String(offerConfig.detalhes).trim() : '';
        if (detailsValue) {
            detailsEl.textContent = detailsValue;
            detailsEl.style.display = '';
            if (detailsContainer) detailsContainer.style.display = '';
        } else {
            detailsEl.style.display = 'none';
            if (detailsContainer) detailsContainer.style.display = 'none';
        }
    }

    if (ctaBtn) {
        const ctaTextoValue = (offerConfig && offerConfig.ctaTexto) ? String(offerConfig.ctaTexto).trim() : '';
        const ctaLinkValue = (offerConfig && offerConfig.ctaLink) ? String(offerConfig.ctaLink).trim() : '';

        if (ctaTextoValue && ctaLinkValue && ctaLinkValue !== '#') {
            ctaBtn.textContent = ctaTextoValue;
            ctaBtn.href = ctaLinkValue;
            ctaBtn.style.display = '';
        } else {
            ctaBtn.style.display = 'none';
        }
    }

    // FORÇAR EXIBIÇÃO DO MODAL - TODOS OS MÉTODOS POSSÍVEIS
    const modal = document.getElementById('offer-modal');
    if (!modal) {
        console.error('❌❌❌ ERRO CRÍTICO: Modal não encontrado!');
        console.log('🔍 Tentando encontrar elementos...');
        console.log('   Todos os IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
        alert('ERRO: Modal de oferta não encontrado. Recarregue a página (F5 ou Cmd+R).');
        return;
    }

    console.log('✅ Modal encontrado! Forçando exibição...');

    // Remover todos os estilos inline que possam estar bloqueando
    modal.removeAttribute('style');

    // Método 1: Adicionar classe
    modal.classList.add('show');

    // Método 2: Forçar display diretamente (fallback mais agressivo)
    modal.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; z-index: 99999 !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important;';

    // Método 3: Verificar após um frame
    requestAnimationFrame(() => {
        const computedStyle = window.getComputedStyle(modal);
        console.log('✅ Popup FORÇADO! Verificação:');
        console.log('   Classes:', modal.className);
        console.log('   Display:', computedStyle.display);
        console.log('   Visibility:', computedStyle.visibility);
        console.log('   Opacity:', computedStyle.opacity);
        console.log('   Z-index:', computedStyle.zIndex);

        // Se ainda não estiver visível, forçar novamente
        if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
            console.warn('⚠️ Modal ainda não visível, forçando novamente...');
            modal.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; z-index: 99999 !important; position: fixed !important;';
        }
    });

    // Forçar novamente após 100ms (garantir que apareceu)
    setTimeout(() => {
        modal.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; z-index: 99999 !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important;';
    }, 100);

    // REGISTRAR ENTREGA NO SUPABASE (depois que o modal foi exibido)
    if (typeof registerOfferDelivery === 'function' && disparoId > 0) {
        // Obter dados do usuário
        const registrationData = localStorage.getItem('webinar_registration');
        let participanteNome = null;
        let participanteCelular = null;

        if (registrationData) {
            try {
                const data = JSON.parse(registrationData);
                participanteNome = data.nome || null;
                participanteCelular = data.celular || null;
            } catch (e) {
                console.warn('Erro ao parsear dados de registro:', e);
            }
        }

        // Registrar entrega (sem await para não bloquear a exibição)
        registerOfferDelivery(disparoId, disparoTimestamp, participanteNome, participanteCelular)
            .then(success => {
                if (success) {
                    console.log('✅ Entrega registrada no Supabase');
                } else {
                    console.warn('⚠️ Falha ao registrar entrega no Supabase');
                }
            })
            .catch(err => {
                console.error('❌ Erro ao registrar entrega:', err);
            });
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
// Função para processar embed code e torná-lo "live-like" (sem controles)
function processEmbedForLive(embedCode) {
    if (!embedCode || !embedCode.trim()) {
        return embedCode;
    }

    // Criar um elemento temporário para processar o HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = embedCode.trim();

    // Processar iframes (YouTube, Vimeo, etc)
    const iframes = tempDiv.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        let src = iframe.getAttribute('src') || '';

        // YouTube - adicionar parâmetros para parecer live (SEM CONTROLES)
        if (src.includes('youtube.com') || src.includes('youtu.be')) {
            // Parse URL e parâmetros
            const url = new URL(src);

            // Remover parâmetros que mostram tempo
            url.searchParams.delete('t');
            url.searchParams.delete('start');
            url.searchParams.delete('time_continue');

            // Adicionar parâmetros para live-like (SEM CONTROLES VISÍVEIS)
            url.searchParams.set('controls', '0'); // SEM controles
            url.searchParams.set('disablekb', '1'); // Desabilitar teclado
            url.searchParams.set('modestbranding', '1'); // Sem branding
            url.searchParams.set('rel', '0'); // Sem vídeos relacionados
            url.searchParams.set('showinfo', '0'); // Sem informações
            url.searchParams.set('iv_load_policy', '3'); // Sem anotações
            url.searchParams.set('cc_load_policy', '0'); // Sem legendas
            url.searchParams.set('fs', '0'); // Sem tela cheia
            url.searchParams.set('autoplay', '1'); // Autoplay
            url.searchParams.set('mute', '0'); // Com áudio
            url.searchParams.set('loop', '0'); // Sem loop (para live)
            url.searchParams.set('playlist', ''); // Limpar playlist
            url.searchParams.set('playsinline', '1'); // Mobile inline
            url.searchParams.set('enablejsapi', '0'); // Desabilitar JS API (reduz controles)
            url.searchParams.set('origin', window.location.origin); // Origin para segurança

            // Para parecer live, remover controle de tempo
            iframe.setAttribute('src', url.toString());
            iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
            iframe.setAttribute('allowfullscreen', 'false'); // Desabilitar fullscreen
            iframe.style.pointerEvents = 'auto';
            iframe.style.overflow = 'hidden';

            // Adicionar listener para remover controles se aparecerem
            setTimeout(() => {
                try {
                    // Tentar acessar o iframe e forçar ocultação de controles
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (iframeDoc) {
                        // Ocultar qualquer elemento de controle
                        const style = iframeDoc.createElement('style');
                        style.textContent = `
                            .ytp-chrome-bottom,
                            .ytp-chrome-controls,
                            .ytp-progress-bar-container,
                            .ytp-gradient-bottom,
                            .ytp-show-cards-title,
                            .ytp-watermark,
                            .ytp-pause-overlay,
                            .ytp-scroll-min,
                            .ytp-scroll-max {
                                display: none !important;
                                visibility: hidden !important;
                                opacity: 0 !important;
                                height: 0 !important;
                                pointer-events: none !important;
                            }
                            .html5-video-player {
                                overflow: hidden !important;
                            }
                        `;
                        iframeDoc.head.appendChild(style);
                    }
                } catch (e) {
                    // Cross-origin - não podemos acessar, mas os parâmetros URL devem funcionar
                    console.log('ℹ️ Não foi possível acessar iframe (cross-origin), usando parâmetros URL');
                }
            }, 1000);
        }

        // Vimeo - adicionar parâmetros
        if (src.includes('vimeo.com')) {
            const url = new URL(src);
            url.searchParams.set('autoplay', '1');
            url.searchParams.set('controls', '0');
            url.searchParams.set('byline', '0');
            url.searchParams.set('title', '0');
            url.searchParams.set('portrait', '0');
            iframe.setAttribute('src', url.toString());
        }

        // Adicionar classe para estilo live
        iframe.classList.add('live-video-embed');
    });

    // Processar elementos de vídeo HTML5
    const videos = tempDiv.querySelectorAll('video');
    videos.forEach(video => {
        video.setAttribute('controls', 'false');
        video.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
        video.setAttribute('disablePictureInPicture', 'true');
        video.classList.add('live-video-embed');
    });

    return tempDiv.innerHTML;
}

async function loadVideoEmbed() {
    try {
        if (typeof getVideoConfig === 'function') {
            const config = await getVideoConfig();
            const videoContainer = document.getElementById('video-container');
            if (videoContainer) {
                // Se houver código embed, usar. Senão, deixar vazio
                if (config.embedCode && config.embedCode.trim()) {
                    // Processar embed para parecer live (sem controles)
                    const processedEmbed = processEmbedForLive(config.embedCode);
                    videoContainer.innerHTML = processedEmbed;
                    console.log('✅ Vídeo embed carregado como LIVE (sem controles):', config.embedCode.substring(0, 50) + '...');
                } else {
                    // Sem vídeo configurado - deixar container vazio
                    videoContainer.innerHTML = '';
                    console.log('ℹ️ Nenhum vídeo configurado no admin');
                }
            }
        } else {
            // Fallback para localStorage
            const stored = localStorage.getItem('admin_video_config');
            if (stored) {
                const config = JSON.parse(stored);
                const videoContainer = document.getElementById('video-container');
                if (videoContainer) {
                    if (config.embedCode && config.embedCode.trim()) {
                        // Processar embed para parecer live
                        const processedEmbed = processEmbedForLive(config.embedCode);
                        videoContainer.innerHTML = processedEmbed;
                    } else {
                        videoContainer.innerHTML = '';
                    }
                }
            }
        }
    } catch (error) {
        console.error('Erro ao carregar configuração de vídeo:', error);
    }
}

// Check on page load (async)
(async function () {
    // Aguardar um pouco para garantir que tudo carregou
    await new Promise(resolve => setTimeout(resolve, 1000));
    await loadOfferConfig(); // Carregar configuração de oferta
    await loadVideoEmbed();

    console.log('✅ Sistema carregado completamente');
    console.log('💡 Funções disponíveis: testOffer(), showOffer(), popup()');
})();

// Listen for storage changes (cross-tab) - apenas para popup de oferta
window.addEventListener('storage', async function (e) {
    // Verificar popup de oferta via storage
    if (e.key === 'last_offer_popup') {
        console.log('🔥 Storage event: Popup de oferta solicitado!');
        await showOfferPopup();
    }
});

// Check when localStorage changes (for same-tab) - apenas para popup de oferta
const originalSetItem = localStorage.setItem;
localStorage.setItem = function (key, value) {
    originalSetItem.apply(this, arguments);
    if (key === 'last_offer_popup') {
        console.log('🔥 localStorage.last_offer_popup atualizado! Mostrando popup...');
        showOfferPopup();
    }
};

// Polling para verificar se há popup de oferta pendente - VERIFICA NO SUPABASE
let lastOfferTimestamp = parseInt(localStorage.getItem('last_offer_popup') || '0') || 0;

// IMPORTANTE: Marcar o timestamp de quando o usuário entrou na página
// Isso evita que ofertas antigas apareçam quando o usuário faz login
const userSessionStartTime = Date.now();
console.log('📌 Sessão iniciada em:', new Date(userSessionStartTime).toLocaleTimeString());

// Verificar a última oferta que este usuário já viu (por dispositivo)
const lastSeenOfferTimestamp = parseInt(localStorage.getItem('last_seen_offer_timestamp') || '0') || 0;

// Ao carregar, NÃO mostrar ofertas antigas - apenas sincronizar o timestamp
(async function checkInitialOffer() {
    try {
        if (typeof getOfferPopupTrigger === 'function') {
            const supabaseTimestamp = await getOfferPopupTrigger();
            // Apenas atualizar o lastOfferTimestamp para o valor atual do Supabase
            // NÃO mostrar o popup - ofertas antigas não devem aparecer ao fazer login
            if (supabaseTimestamp > lastOfferTimestamp) {
                console.log('📌 Sincronizando timestamp de oferta (sem mostrar popup antigo)');
                console.log('   - Timestamp do Supabase:', supabaseTimestamp);
                console.log('   - Ofertas só aparecerão para disparos NOVOS após:', new Date(userSessionStartTime).toLocaleTimeString());
                lastOfferTimestamp = supabaseTimestamp;
                // Marcar como já vista para não aparecer novamente
                localStorage.setItem('last_seen_offer_timestamp', supabaseTimestamp.toString());
            }
        }
    } catch (e) {
        console.warn('Erro ao verificar oferta inicial:', e);
    }
})();

// Polling contínuo no Supabase para detectar novos disparos
setInterval(async () => {
    try {
        // Verificar localStorage primeiro (resposta mais rápida)
        const localTimestamp = parseInt(localStorage.getItem('last_offer_popup') || '0') || 0;
        const lastSeen = parseInt(localStorage.getItem('last_seen_offer_timestamp') || '0') || 0;

        // Só mostrar se for um disparo NOVO que este usuário ainda não viu
        if (localTimestamp > lastOfferTimestamp && localTimestamp > lastSeen) {
            console.log('🔄 Polling (localStorage) detectou novo disparo de oferta!');
            lastOfferTimestamp = localTimestamp;
            localStorage.setItem('last_seen_offer_timestamp', localTimestamp.toString());
            await showOfferPopup();
            return;
        }

        // Verificar Supabase (para usuários em diferentes dispositivos/navegadores)
        if (typeof getOfferPopupTrigger === 'function') {
            const supabaseTimestamp = await getOfferPopupTrigger();
            // Só mostrar se for um disparo NOVO que este usuário ainda não viu
            if (supabaseTimestamp > lastOfferTimestamp && supabaseTimestamp > lastSeen) {
                console.log('🔄🔄🔄 POLLING (SUPABASE) DETECTOU NOVO DISPARO DE OFERTA! 🔄🔄🔄');
                lastOfferTimestamp = supabaseTimestamp;
                localStorage.setItem('last_seen_offer_timestamp', supabaseTimestamp.toString());
                await showOfferPopup();
            }
        }
    } catch (e) {
        console.warn('Erro no polling de oferta:', e);
    }
}, 1000); // Verifica a cada 1 segundo no Supabase

// Close button - attach event listener
setTimeout(() => {
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
(function () {
    // Listen for offer popup events (mesma aba) - MÚLTIPLOS LISTENERS
    const handler1 = async function (e) {
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
        offerChannel.addEventListener('message', async function (e) {
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

// Funções já definidas no início do arquivo (linha ~2)

// Timer functionality
let streamStartTime = Date.now();

function updateTimer() {
    const elapsed = Date.now() - streamStartTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const totalSeconds = Math.floor(elapsed / 1000);

    const formattedTime =
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0');

    document.getElementById('stream-timer').textContent = formattedTime;

    // Check for auto offer trigger
    checkAutoTrigger(totalSeconds);

    // Check for scheduled comments
    if (typeof checkScheduledComments === 'function') {
        checkScheduledComments(totalSeconds);
    }

    // Check for AUTO SAD COMMENTS TRIGGER at 08:18
    if (currentTimeStr === '08:18' && !sadCommentsTriggered) {
        console.log('😢 Disparando bateria de comentários tristes automáticos (08:18)!');
        sadCommentsTriggered = true;
        triggerSadCommentsBurst();
    }
}

// Control variable for sad comments auto-trigger
let sadCommentsTriggered = false;

function triggerSadCommentsBurst() {
    const comentarios = getAdminComments(); // Uses existing admin comments
    const tristes = comentarios.tristes || ['Que pena...', 'Poxa vida', 'Não acredito', 'Triste demais', 'Queria tanto'];

    // Disparar cerca de 24 comentários tristes num intervalo curto
    const quantity = 24;

    for (let i = 0; i < quantity; i++) {
        // Espalhados pelos próximos 5 segundos
        const delay = Math.random() * 5000;

        setTimeout(() => {
            const msg = tristes[Math.floor(Math.random() * tristes.length)];
            const name = getRandomParticipantName();
            addChatMessage(name, msg);
        }, delay);
    }
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

// Histórico de mensagens recentes para evitar repetições
let recentMessages = [];
const MAX_RECENT_MESSAGES = 15;

// Load admin comments - VERSÃO COM MUITO MAIS VARIEDADE
function getAdminComments() {
    const comentarios = JSON.parse(localStorage.getItem('admin_comentarios') || '{}');

    const animacao = comentarios.animacao || [
        // Entusiasmo geral
        'Que sorteio incrível! Quero muito ganhar!',
        'Estou participando! Seria um sonho ganhar!',
        'Finalmente um sorteio de verdade! Torcendo muito!',
        'Meu celular está quebrado, seria perfeito ganhar!',
        'Esse sorteio é tudo de bom! Estou dentro!',
        'Nunca vi um sorteio tão bom assim!',
        'Vou ganhar, tenho fé! 🙏',
        'Esse prêmio vai mudar minha vida!',
        'Participando e torcendo muito! 🍀',
        'Que oportunidade maravilhosa!',
        // Comentários sobre o prêmio
        'Sempre quis ter um celular novo!',
        'O meu celular já tá no último suspiro kkkk',
        'Preciso muito desse prêmio!',
        'Seria o presente perfeito! 🎁',
        'Imagina ganhar isso! Que sonho!',
        'Já tô imaginando ele na minha mão!',
        'Esse prêmio é demais!',
        'Preciso trocar meu celular urgente!',
        'Participando com toda fé do mundo!',
        'Quem sabe dessa vez eu ganho!',
        // Interação natural
        'Boa sorte a todos! 🍀',
        'Tô muito ansioso pro resultado!',
        'Alguém mais nervoso aqui? 😅',
        'Esse sorteio tá demais!',
        'Valeu pela oportunidade!',
        'Que legal esse projeto!',
        'Adorei! Tô participando!',
        'Vamos que vamos! 💪',
        'Confiante! Vai dar certo!',
        'Obrigado por esse sorteio incrível!'
    ];

    const tristes = comentarios.tristes || [
        // Lamentações leves
        'Acho que nunca ganho nada... 😢',
        'Sempre participo mas não tenho sorte',
        'Será que dessa vez vai?',
        'Tô sem esperança já...',
        'Nunca ganhei um sorteio na vida',
        'Queria tanto ganhar dessa vez',
        'Minha sorte é péssima 😔',
        'Já me conformei que não vou ganhar',
        'Vou tentar, mas não tenho muita fé',
        'Sorteios nunca dão certo pra mim',
        // Comentários mais neutros/realistas
        'Difícil ganhar com tanta gente...',
        'Muita gente participando né',
        'As chances são pequenas mas vou tentar',
        'Pelo menos tô participando',
        'Vai que dessa vez dá certo',
        'Bom, custar não custa tentar né',
        'Quem dera eu ganhasse algo...',
        'Tomara que eu tenha sorte dessa vez',
        'Faz tempo que não ganho nada',
        'Espero que pelo menos alguém mereça ganhar',
        // Ansiedade/nervosismo
        'Tô nervoso demais já',
        'Que ansiedade! 😰',
        'Não aguento mais esperar...',
        'Meu coração tá acelerado',
        'Ai que tensão esse sorteio',
        'Tô com o coração na mão',
        'Nervosismo a mil aqui',
        'Será que vai demorar muito?',
        'Essa espera tá me matando',
        'Não consigo parar de pensar no resultado'
    ];

    return { animacao, tristes };
}

// Função para pegar mensagem sem repetir as recentes
function getUniqueMessage(messages) {
    if (!messages || messages.length === 0) return null;

    // Filtrar mensagens que não foram usadas recentemente
    const availableMessages = messages.filter(msg => !recentMessages.includes(msg));

    // Se todas foram usadas recentemente, limpar histórico e usar qualquer uma
    if (availableMessages.length === 0) {
        recentMessages = [];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    // Pegar uma mensagem aleatória das disponíveis
    const selectedMessage = availableMessages[Math.floor(Math.random() * availableMessages.length)];

    // Adicionar ao histórico de recentes
    recentMessages.push(selectedMessage);

    // Manter o histórico limitado
    if (recentMessages.length > MAX_RECENT_MESSAGES) {
        recentMessages.shift();
    }

    return selectedMessage;
}

// Get random participant names for messages (for automatic messages only)
const automaticNames = ['Maria', 'João', 'Ana', 'Pedro', 'Julia', 'Carlos', 'Fernanda', 'Lucas', 'Beatriz', 'Rafael', 'Mariana', 'Bruno'];

function getRandomParticipantName() {
    // Obter nome do usuário atual para excluir
    let currentUserName = '';
    try {
        const registrationData = localStorage.getItem('webinar_registration');
        if (registrationData) {
            const data = JSON.parse(registrationData);
            currentUserName = (data.nome || '').trim().toLowerCase();
        }
    } catch (e) {
        // Ignorar erro
    }

    try {
        const participantes = JSON.parse(localStorage.getItem('webinar_participantes') || '[]');

        // Filtrar participantes válidos excluindo o usuário atual
        const availableParticipants = participantes.filter(p => {
            if (!p || !p.nome) return false;
            const participantName = (p.nome || '').trim().toLowerCase();
            const participantFirstName = participantName.split(' ')[0];
            return participantName !== currentUserName &&
                participantFirstName !== currentUserName &&
                participantName !== '';
        });

        if (availableParticipants.length > 0) {
            const random = availableParticipants[Math.floor(Math.random() * availableParticipants.length)];
            const firstName = random.nome.split(' ')[0].trim();
            if (firstName) {
                return firstName;
            }
        }
    } catch (e) {
        console.warn('Erro ao buscar participantes:', e);
    }

    // Filtrar nomes automáticos excluindo o primeiro nome do usuário atual
    const userFirstName = currentUserName.split(' ')[0];
    const availableNames = automaticNames.filter(name => {
        const nameLower = name.toLowerCase();
        return nameLower !== currentUserName && nameLower !== userFirstName;
    });

    if (availableNames.length > 0) {
        return availableNames[Math.floor(Math.random() * availableNames.length)];
    }

    // Se não houver nomes disponíveis, retornar um aleatório mesmo (garantir que sempre retorna algo)
    if (automaticNames.length > 0) {
        return automaticNames[Math.floor(Math.random() * automaticNames.length)];
    }

    // Fallback final - nunca deve chegar aqui
    return 'Usuário';
}

// Process pending messages from admin
function processPendingMessages() {
    try {
        const pendingMessages = JSON.parse(localStorage.getItem('webinar_pending_messages') || '[]');

        if (!Array.isArray(pendingMessages)) {
            console.warn('⚠️ webinar_pending_messages não é um array válido');
            return;
        }

        if (pendingMessages.length > 0) {
            console.log(`📦 Processando ${pendingMessages.length} mensagem(ns) pendente(s)...`);

            const now = Date.now();
            const messagesToShow = pendingMessages.filter(msg => {
                // Filtrar apenas mensagens válidas com username e message
                return msg &&
                    msg.timestamp <= now &&
                    msg.username &&
                    String(msg.username).trim() !== '' &&
                    msg.message &&
                    String(msg.message).trim() !== '';
            });

            console.log(`✅ ${messagesToShow.length} mensagem(ns) pronta(s) para exibição`);

            messagesToShow.forEach(msg => {
                // Validar antes de adicionar
                const validUsername = String(msg.username || '').trim();
                const validMessage = String(msg.message || '').trim();

                if (validUsername && validMessage) {
                    addChatMessage(validUsername, validMessage);
                    console.log(`✅ Mensagem adicionada: ${validUsername}: ${validMessage.substring(0, 50)}...`);
                } else {
                    console.warn('⚠️ Mensagem inválida ignorada:', msg);
                }
            });

            // Remove processed messages
            const remainingMessages = pendingMessages.filter(msg => msg.timestamp > now);

            if (remainingMessages.length !== pendingMessages.length) {
                localStorage.setItem('webinar_pending_messages', JSON.stringify(remainingMessages));
                console.log(`📊 ${remainingMessages.length} mensagem(ns) ainda pendente(s)`);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao processar mensagens pendentes:', error);
    }
}

// Listen for admin actions - MÚLTIPLOS MÉTODOS PARA GARANTIR SINCRONIZAÇÃO
window.addEventListener('admin-messages-added', function () {
    console.log('🔥 Evento admin-messages-added recebido! Processando mensagens...');
    processPendingMessages();
});

// Storage event para sincronizar entre abas (CRÍTICO)
window.addEventListener('storage', function (e) {
    if (e.key === 'webinar_pending_messages') {
        console.log('🔥 Storage event detectado para webinar_pending_messages! Processando...');
        processPendingMessages();
    }
});

// BroadcastChannel para sincronizar entre abas (mais confiável)
try {
    const messageChannel = new BroadcastChannel('webinar-messages');
    messageChannel.addEventListener('message', function (e) {
        if (e.data && e.data.type === 'messages-added') {
            console.log(`🔥 BroadcastChannel: ${e.data.count} nova(s) mensagem(ns) recebida(s)! Processando...`);
            processPendingMessages();
        }
    });
    console.log('✅ BroadcastChannel configurado para mensagens');
} catch (e) {
    console.warn('⚠️ BroadcastChannel não disponível para mensagens:', e);
}

window.addEventListener('admin-clear-chat', function () {
    if (chatMessages) {
        chatMessages.innerHTML = '';
        console.log('✅ Chat limpo');
    }
});

// Sistema de ganhadores removido - apenas popup de oferta será usado

// Check for pending messages every second (polling como backup)
setInterval(() => {
    processPendingMessages();
}, 1000);

// Processar imediatamente ao carregar (caso haja mensagens pendentes)
setTimeout(() => {
    processPendingMessages();
}, 500);

// Add admin-controlled messages periodically (automatic) - COM SISTEMA ANTI-REPETIÇÃO
let messageType = 'animacao'; // Alternate between animacao and tristes
function addAdminMessage() {
    const comentarios = getAdminComments();
    const activeComentarios = comentarios[messageType];

    if (activeComentarios && activeComentarios.length > 0) {
        // Usar função anti-repetição para pegar mensagem única
        const randomMessage = getUniqueMessage(activeComentarios);
        const randomName = getRandomParticipantName();

        // Validar antes de adicionar
        if (randomMessage && randomMessage.trim() && randomName && randomName.trim()) {
            addChatMessage(randomName, randomMessage);
        } else {
            console.warn('⚠️ Mensagem ou nome inválido:', { randomName, randomMessage });
        }
    }

    // Alternate message type
    messageType = messageType === 'animacao' ? 'tristes' : 'animacao';
}

// Initial Comments Burst (First 20 seconds)
function scheduleInitialComments() {
    const initialPhrases = [
        'Cheguei!', 'Cheguei',
        'Estou ansioso', 'Ansioso demais!',
        'Quero ganhar', 'Quero ganhar muito!', 'Hoje eu ganho!',
        'Boa noite', 'Boa noite a todos', 'Boa noite!',
        'Que sorteio bom', 'Top demais esse sorteio'
    ];

    // Create ~15-20 initial comments spread over 20 seconds
    const numberOfComments = 15 + Math.floor(Math.random() * 6); // 15 to 20 comments

    for (let i = 0; i < numberOfComments; i++) {
        // Random time betweem 1s and 20s
        const delay = Math.random() * 19000 + 1000;

        setTimeout(() => {
            const randomMessage = initialPhrases[Math.floor(Math.random() * initialPhrases.length)];
            const randomName = getRandomParticipantName();
            addChatMessage(randomName, randomMessage);
        }, delay);
    }
}

// Start initial comments immediately
scheduleInitialComments();

// Start adding regular admin messages AFTER 20 seconds (so they dont overlap too much with initial burst)
setTimeout(() => {
    setInterval(addAdminMessage, Math.random() * 10000 + 15000);
}, 20000);

function addChatMessage(username, message) {
    // Validar e garantir que username e message não sejam undefined/null
    const validUsername = (username && String(username).trim()) || 'Usuário';
    const validMessage = (message && String(message).trim()) || '...';

    // Se ainda estiver vazio após validação, não adicionar
    if (!validMessage || validMessage === '...') {
        console.warn('⚠️ Tentativa de adicionar mensagem inválida:', { username, message });
        return;
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';

    const usernameSpan = document.createElement('span');
    usernameSpan.className = 'username';
    usernameSpan.textContent = validUsername + ':';

    const textSpan = document.createElement('span');
    textSpan.className = 'message-text';
    textSpan.textContent = ' ' + validMessage;

    messageDiv.appendChild(usernameSpan);
    messageDiv.appendChild(textSpan);

    if (chatMessages) {
        chatMessages.appendChild(messageDiv);
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } else {
        console.error('❌ Elemento chat-messages não encontrado!');
    }
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

// Sistema de ganhadores removido

// Auto-scroll chat to bottom on load
if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Scheduled Comments System
let scheduledCommentsData = [];
let firedScheduledComments = new Set();

async function loadScheduledCommentsData() {
    try {
        if (typeof getScheduledComments === 'function') {
            scheduledCommentsData = await getScheduledComments();
        } else {
            scheduledCommentsData = JSON.parse(localStorage.getItem('admin_scheduled_comments') || '[]');
        }
        console.log('📅 Comentários agendados carregados:', scheduledCommentsData.length);
    } catch (e) {
        console.warn('Erro ao carregar comentários agendados:', e);
        // Fallback
        scheduledCommentsData = JSON.parse(localStorage.getItem('admin_scheduled_comments') || '[]');
    }
}

// Initial load
loadScheduledCommentsData();

// Listen for updates
window.addEventListener('storage', function (e) {
    if (e.key === 'admin_scheduled_comments') {
        console.log('📅 Atualização de comentários agendados detectada!');
        loadScheduledCommentsData();
    }
});

function checkScheduledComments(currentSeconds) {
    if (!scheduledCommentsData || scheduledCommentsData.length === 0) return;

    scheduledCommentsData.forEach(comment => {
        // Parse comment time to seconds
        let commentSeconds = 0;
        try {
            const parts = comment.time.split(':');
            commentSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        } catch (e) {
            return; // Skip invalid time
        }

        // Check if time matches/passed and wasn't fired yet
        if (currentSeconds >= commentSeconds && !firedScheduledComments.has(comment.id)) {
            console.log(`⏰ Disparando comentário agendado: [${comment.time}] ${comment.username}: ${comment.message}`);

            // Add to chat
            addChatMessage(comment.username, comment.message);

            // Mark as fired
            firedScheduledComments.add(comment.id);
        }
    });
}
