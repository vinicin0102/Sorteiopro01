// Admin Configuration
const ADMIN_PASSWORD = 'admin123'; // Mude esta senha!

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    checkLogin();
    
    // Aguardar Supabase carregar
    await new Promise(resolve => setTimeout(resolve, 500));
    
    initializeEventListeners();
    await loadFormData();
    await loadParticipantes();
    
    // Carregar comentários (não precisa async)
    if (typeof loadComentariosEditor === 'function') {
        loadComentariosEditor();
    }
    
    // Adicionar debug
    console.log('✅ Admin inicializado');
    
    // Aguardar mais um pouco para garantir que Supabase carregou
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const db = await getSupabase();
    if (db && typeof db.from === 'function') {
        console.log('✅ Supabase conectado no admin');
    } else {
        console.warn('⚠️ Supabase não conectado no admin - usando localStorage');
        if (db) {
            console.error('❌ db.from não é uma função. db:', db);
        }
    }
});

// Login Functions
function checkLogin() {
    const isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
    if (isLoggedIn) {
        showAdminPanel();
    } else {
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-panel').style.display = 'none';
}

function showAdminPanel() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'flex';
}

function initializeEventListeners() {
    // Login
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('admin-password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleLogin();
    });
    
    // Navigation Tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', async function() {
            const section = this.getAttribute('data-section');
            await switchSection(section);
            
            // Update active nav
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Disparar comentários
    document.querySelectorAll('.disparar-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            dispararComentarios(type);
        });
    });
    
    // Limpar chat
    document.getElementById('limpar-chat-btn').addEventListener('click', limparChat);
    
    // Editor de comentários tabs
    document.querySelectorAll('.editor-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabType = this.getAttribute('data-tab');
            switchComentariosTab(tabType);
        });
    });
    
    // Adicionar comentários no editor
    document.querySelectorAll('.add-comentario-editor-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            addComentarioEditor(type);
        });
    });
    
    // Salvar comentários
    const saveComentariosBtn = document.getElementById('save-comentarios-btn');
    if (saveComentariosBtn) {
        saveComentariosBtn.addEventListener('click', saveComentariosEditor);
    }
    
    // Carregar comentários no editor
    (async () => await loadComentariosEditor())();
    
    // Save Form
    const saveFormBtn = document.getElementById('save-form-btn');
    if (saveFormBtn) {
        saveFormBtn.addEventListener('click', saveFormData);
    }
    
    // Image upload handlers
    const mainImageInput = document.getElementById('form-image-main');
    const highlightImageInput = document.getElementById('form-image-highlight');
    const fileInput = document.getElementById('form-file');
    
    if (mainImageInput) {
        mainImageInput.addEventListener('change', function(e) {
            handleImageUpload(e, 'main');
        });
    }
    
    if (highlightImageInput) {
        highlightImageInput.addEventListener('change', function(e) {
            handleImageUpload(e, 'highlight');
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            handleFileUpload(e);
        });
    }
    
    // Participantes - busca
    const searchInput = document.getElementById('search-participante');
    if (searchInput) {
        searchInput.addEventListener('input', filterParticipantes);
    }
    
    // Refresh participantes button
    const refreshBtn = document.getElementById('refresh-participantes');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.disabled = true;
            refreshBtn.textContent = '🔄 Atualizando...';
            
            // Sempre carregar visualização simples (sem checkboxes)
            await loadParticipantes();
            
            refreshBtn.disabled = false;
            refreshBtn.textContent = '🔄 Atualizar';
        });
    }
    
    // Salvar mensagem de ganhador
    const saveWinnerMessageBtn = document.getElementById('save-winner-message-btn');
    if (saveWinnerMessageBtn) {
        saveWinnerMessageBtn.addEventListener('click', saveWinnerMessage);
    }
    
    // Disparar popup de oferta
    const triggerOfferBtn = document.getElementById('trigger-offer-btn');
    if (triggerOfferBtn) {
        triggerOfferBtn.addEventListener('click', triggerOfferPopup);
    }
    
    // Salvar oferta
    const saveOfferBtn = document.getElementById('save-offer-btn');
    if (saveOfferBtn) {
        saveOfferBtn.addEventListener('click', saveOfferConfigHandler);
    }
    
    // Salvar vídeo
    const saveVideoBtn = document.getElementById('save-video-btn');
    if (saveVideoBtn) {
        saveVideoBtn.addEventListener('click', saveVideoConfigHandler);
    }
    
    // Carregar mensagem de ganhador ao abrir seção de sorteio
    loadWinnerMessage();
    
    // Botão de atualizar logs
    const refreshLogsBtn = document.getElementById('refresh-logs-btn');
    if (refreshLogsBtn) {
        refreshLogsBtn.addEventListener('click', loadAccessLogs);
    }
}

async function handleLogin() {
    const password = document.getElementById('admin-password').value;
    const errorMsg = document.getElementById('login-error');
    
    if (password === ADMIN_PASSWORD) {
        // Salvar log de acesso bem-sucedido
        if (typeof saveAdminLoginLog === 'function') {
            await saveAdminLoginLog(true, null); // Não salvar senha, apenas sucesso
        }
        
        localStorage.setItem('admin_logged_in', 'true');
        showAdminPanel();
        errorMsg.classList.remove('show');
        
        // Limpar campo de senha
        document.getElementById('admin-password').value = '';
    } else {
        // Salvar log de tentativa de acesso falhada
        if (typeof saveAdminLoginLog === 'function') {
            await saveAdminLoginLog(false, password ? 'attempted' : null);
        }
        
        errorMsg.textContent = 'Senha incorreta!';
        errorMsg.classList.add('show');
        
        // Limpar campo de senha após erro
        document.getElementById('admin-password').value = '';
    }
}

// Carregar e exibir logs de acesso
async function loadAccessLogs() {
    try {
        const logsList = document.getElementById('logs-list');
        const totalLogsEl = document.getElementById('total-logs');
        const successLogsEl = document.getElementById('success-logs');
        const failedLogsEl = document.getElementById('failed-logs');
        
        if (!logsList) return;
        
        logsList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Carregando logs...</p>';
        
        let logs = [];
        if (typeof getAdminLoginLogs === 'function') {
            logs = await getAdminLoginLogs();
        } else {
            // Fallback
            const stored = localStorage.getItem('admin_login_logs');
            if (stored) {
                logs = JSON.parse(stored).reverse();
            }
        }
        
        // Estatísticas
        const total = logs.length;
        const success = logs.filter(l => l.success === true || l.success === 'true').length;
        const failed = total - success;
        
        if (totalLogsEl) totalLogsEl.textContent = total;
        if (successLogsEl) successLogsEl.textContent = success;
        if (failedLogsEl) failedLogsEl.textContent = failed;
        
        // Exibir logs
        if (logs.length === 0) {
            logsList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Nenhum log de acesso encontrado.</p>';
            return;
        }
        
        logsList.innerHTML = logs.map(log => {
            const date = new Date(log.timestamp || log.created_at);
            const formattedDate = date.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            const success = log.success === true || log.success === 'true';
            const device = log.device || 'desktop';
            const deviceIcon = device === 'mobile' ? '📱' : '💻';
            
            return `
                <div style="padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; ${success ? 'background: #e8f5e9;' : 'background: #ffebee;'}">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                            <span style="font-weight: 600; color: ${success ? '#2e7d32' : '#c62828'};">
                                ${success ? '✅ Login Bem-sucedido' : '❌ Tentativa Falhada'}
                            </span>
                            <span style="color: #666; font-size: 14px;">${deviceIcon} ${device}</span>
                        </div>
                        <div style="color: #666; font-size: 13px;">
                            ${formattedDate}
                        </div>
                        ${log.user_agent ? `<div style="color: #999; font-size: 12px; margin-top: 5px; word-break: break-all;">${log.user_agent.substring(0, 100)}${log.user_agent.length > 100 ? '...' : ''}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Erro ao carregar logs:', error);
        const logsList = document.getElementById('logs-list');
        if (logsList) {
            logsList.innerHTML = '<p style="text-align: center; color: #c62828; padding: 20px;">Erro ao carregar logs. Tente novamente.</p>';
        }
    }
}

async function switchSection(section) {
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    const sectionEl = document.getElementById(section + '-section');
    if (sectionEl) {
        sectionEl.classList.add('active');
    }
    
    // Load data when switching to specific sections
    if (section === 'sorteio') {
        await loadParticipantes(); // Carrega participantes apenas para visualização
        await loadWinnerMessage(); // Carrega mensagem de ganhador
    }
    if (section === 'oferta') {
        await loadOfferConfig(); // Carrega configuração de oferta
        await loadVideoConfig(); // Carrega configuração de vídeo
    }
    if (section === 'logs') {
        await loadAccessLogs(); // Carrega logs de acesso
    }
}

// Lista de nomes brasileiros para simular pessoas reais
const randomNames = [
    'Maria Silva', 'João Santos', 'Ana Oliveira', 'Pedro Costa', 'Julia Ferreira',
    'Carlos Souza', 'Fernanda Lima', 'Lucas Alves', 'Beatriz Rodrigues', 'Rafael Pereira',
    'Mariana Gomes', 'Bruno Martins', 'Camila Rocha', 'Thiago Dias', 'Larissa Araujo',
    'Gabriel Ribeiro', 'Isabela Nunes', 'Felipe Barbosa', 'Amanda Correia', 'Guilherme Monteiro',
    'Laura Cardoso', 'Matheus Ramos', 'Sophia Carvalho', 'Enzo Moura', 'Yasmin Rezende',
    'Nicolas Freitas', 'Valentina Teixeira', 'Arthur Duarte', 'Manuela Castro', 'Bernardo Lopes',
    'Alice Mendes', 'Heitor Pinheiro', 'Helena Nascimento', 'Davi Machado', 'Maria Eduarda',
    'Lorenzo Pires', 'Antonia Vieira', 'Miguel Farias', 'Cecília Coelho', 'Samuel Azevedo',
    'Emanuelly Barros', 'Anthony Melo', 'Lívia Campos', 'Breno Novaes', 'Luiza Paiva',
    'Gustavo Peixoto', 'Melissa Miranda', 'Henrique Bento', 'Clara Tavares', 'Vicente Andrade'
];

// Normalizar URL - adiciona http:// se necessário
function normalizeUrl(url) {
    if (!url || url.trim() === '' || url === '#') {
        return '#';
    }
    
    url = url.trim();
    
    // Se já começar com http:// ou https://, retorna como está
    if (/^https?:\/\//i.test(url)) {
        return url;
    }
    
    // Se começar com www., adiciona https://
    if (/^www\./i.test(url)) {
        return 'https://' + url;
    }
    
    // Caso contrário, adiciona https://
    return 'https://' + url;
}

// Get unique random name (ensures different names for each message)
const usedNames = new Set();

function getUniqueRandomName(participantes) {
    // Obter nome do usuário atual para excluir
    let currentUserName = '';
    try {
        const registrationData = localStorage.getItem('webinar_registration');
        if (registrationData) {
            const data = JSON.parse(registrationData);
            currentUserName = (data.nome || '').trim().toLowerCase();
        }
    } catch (e) {
        console.warn('Erro ao obter nome do usuário atual:', e);
    }
    
    // Try to use real participant names first (excluindo o usuário atual)
    if (participantes.length > 0) {
        const availableParticipants = participantes.filter(p => {
            const participantName = (p.nome || '').trim().toLowerCase();
            return !usedNames.has(p.nome) && participantName !== currentUserName;
        });
        if (availableParticipants.length > 0) {
            const selected = availableParticipants[Math.floor(Math.random() * availableParticipants.length)];
            usedNames.add(selected.nome);
            return selected.nome.split(' ')[0]; // First name only
        }
    }
    
    // Use random names from list (excluindo o nome do usuário atual se estiver na lista)
    const availableNames = randomNames.filter(name => {
        const nameLower = name.trim().toLowerCase();
        const firstNameLower = name.split(' ')[0].toLowerCase();
        return !usedNames.has(name) && 
               nameLower !== currentUserName && 
               firstNameLower !== currentUserName;
    });
    
    if (availableNames.length === 0) {
        // Reset if all names used (mas ainda excluir o usuário atual)
        usedNames.clear();
        const resetNames = randomNames.filter(name => {
            const firstNameLower = name.split(' ')[0].toLowerCase();
            return firstNameLower !== currentUserName;
        });
        if (resetNames.length > 0) {
            return resetNames[Math.floor(Math.random() * resetNames.length)].split(' ')[0];
        }
        // Se ainda não tiver nomes, usar qualquer um
        return randomNames[Math.floor(Math.random() * randomNames.length)].split(' ')[0];
    }
    
    const selected = availableNames[Math.floor(Math.random() * availableNames.length)];
    usedNames.add(selected);
    return selected.split(' ')[0]; // First name only
}

// Disparar Comentários
async function dispararComentarios(type) {
    const inputId = type === 'tristes' ? 'qtd-tristes' : 'qtd-animacao';
    const quantity = parseInt(document.getElementById(inputId).value) || 1;
    
    // Get comments from database
    const comentarios = await getComments();
    
    let messagesToSend = [];
    
    if (type === 'tristes') {
        // Comentários tristes
        const tristes = comentarios.tristes || [
            'Que triste, perdi o sorteio de novo...',
            'Sempre participo mas nunca ganho nada 😢',
            'Parece que não é pra mim mesmo...',
            'Mais um sorteio que vou perder, certeza',
            'Já desisti de ganhar alguma coisa',
            'Sempre vejo outros ganhando, menos eu',
            'Será que um dia eu vou ganhar?',
            'Tô triste, mais uma vez não fui sorteado',
            'Parece que sorte não existe pra mim',
            'Vou tentar de novo, mas não tenho muita esperança'
        ];
        messagesToSend = tristes;
    } else if (type === 'animacao') {
        // Comentários de animação
        const animacao = comentarios.animacao || [
            'Que sorteio incrível! Quero muito ganhar esse iPhone!',
            'Estou participando! Seria um sonho ganhar!',
            'Finalmente um sorteio de verdade! Torcendo muito!',
            'Meu celular está quebrado, seria perfeito ganhar!',
            'iPhone é tudo de bom! Estou dentro!',
            'Que oportunidade incrível! Vou ganhar!',
            'Sonhando com esse iPhone! Seria perfeito!',
            'Estou animado demais com esse sorteio!',
            'Vou ganhar esse iPhone, tenho certeza!',
            'Seria incrível ganhar! Estou torcendo muito!',
            'iPhone novo seria um sonho!',
            'Torcendo muito pra ganhar!',
            'Esse é o meu sorteio! Vou ganhar!',
            'Quero muito esse iPhone! 🎉'
        ];
        messagesToSend = animacao;
    }
    
    // Clear used names for this batch
    usedNames.clear();
    
    // Trigger messages in webinar (store in localStorage for webinar to read)
    const messages = [];
    const participantes = await getAllParticipants();
    
    // Shuffle messages to send
    const shuffledMessages = [...messagesToSend].sort(() => Math.random() - 0.5);
    
    const baseTimestamp = Date.now();
    for (let i = 0; i < quantity; i++) {
        // Cycle through messages or use random
        const messageIndex = i % shuffledMessages.length;
        const message = shuffledMessages[messageIndex] || shuffledMessages[Math.floor(Math.random() * shuffledMessages.length)];
        
        // Validar mensagem
        if (!message || !String(message).trim()) {
            console.warn(`⚠️ Mensagem vazia ignorada no índice ${i}`);
            continue;
        }
        
        // Get unique name for each message
        const uniqueName = getUniqueRandomName(participantes);
        
        // Validar nome
        if (!uniqueName || !String(uniqueName).trim()) {
            console.warn(`⚠️ Nome vazio ignorado no índice ${i}`);
            continue;
        }
        
        messages.push({
            username: String(uniqueName).trim(),
            message: String(message).trim(),
            timestamp: baseTimestamp + (i * 1000) // Stagger messages by 1 second
        });
    }
    
    if (messages.length === 0) {
        alert('❌ Erro: Nenhuma mensagem válida foi preparada. Verifique se há comentários configurados.');
        return;
    }
    
    // Store messages to be displayed
    const pendingMessages = JSON.parse(localStorage.getItem('webinar_pending_messages') || '[]');
    pendingMessages.push(...messages);
    localStorage.setItem('webinar_pending_messages', JSON.stringify(pendingMessages));
    
    // Disparar evento de storage para sincronizar entre abas (CRÍTICO)
    try {
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'webinar_pending_messages',
            newValue: JSON.stringify(pendingMessages),
            oldValue: localStorage.getItem('webinar_pending_messages'),
            storageArea: localStorage
        }));
        console.log('✅ StorageEvent disparado para sincronizar mensagens');
    } catch (e) {
        console.warn('Erro ao disparar StorageEvent:', e);
    }
    
    // Trigger event na mesma aba
    window.dispatchEvent(new CustomEvent('admin-messages-added'));
    
    // BroadcastChannel para outras abas (mais confiável)
    try {
        const channel = new BroadcastChannel('webinar-messages');
        channel.postMessage({
            type: 'messages-added',
            count: messages.length
        });
        console.log('✅ BroadcastChannel disparado para outras abas');
    } catch (e) {
        console.warn('BroadcastChannel não disponível:', e);
    }
    
    console.log(`✅ ${quantity} comentário(s) ${type === 'tristes' ? 'tristes' : 'de animação'} preparados para envio!`);
    console.log('📦 Mensagens salvas:', messages);
    
    alert(`Disparando ${quantity} comentário(s) ${type === 'tristes' ? 'tristes' : 'de animação'} com nomes diferentes!\n\nAs mensagens aparecerão no webinar a cada 1 segundo.`);
}


function limparChat() {
    if (confirm('Tem certeza que deseja limpar todo o chat? Esta ação não pode ser desfeita.')) {
        localStorage.setItem('webinar_pending_messages', JSON.stringify([]));
        window.dispatchEvent(new CustomEvent('admin-clear-chat'));
        alert('Chat limpo com sucesso!');
    }
}

// Form Editor
async function loadFormData() {
    const formData = await getFormConfig();
    const titleEl = document.getElementById('form-title');
    const subtitleEl = document.getElementById('form-subtitle');
    const highlightTitleEl = document.getElementById('form-highlight-title');
    const highlightSubtitleEl = document.getElementById('form-highlight-subtitle');
    const timeEl = document.getElementById('form-time');
    
    if (titleEl) titleEl.value = formData.title || 'FABRICANDO SEU LOW TICKET';
    if (subtitleEl) subtitleEl.value = formData.subtitle || 'plug and play';
    if (highlightTitleEl) highlightTitleEl.value = formData.highlightTitle || 'Como fazer 1k/dia vendendo Low Ticket Plug and Play';
    if (highlightSubtitleEl) highlightSubtitleEl.value = formData.highlightSubtitle || 'Sem precisar de Audiência e 100% Automatizado';
    if (timeEl) timeEl.value = formData.time || 'Aula às 20h00';
    
    // Load images
    if (formData.imageMain) {
        showImagePreview('main', formData.imageMain);
    }
    if (formData.imageHighlight) {
        showImagePreview('highlight', formData.imageHighlight);
    }
    if (formData.file) {
        showFilePreview(formData.file);
    }
}

function handleImageUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem!');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = e.target.result;
        showImagePreview(type, imageData);
        
        // Save to formData temporarily (will be saved on form save)
        const formData = JSON.parse(localStorage.getItem('admin_form_data') || '{}');
        if (type === 'main') {
            formData.imageMain = imageData;
        } else if (type === 'highlight') {
            formData.imageHighlight = imageData;
        }
        localStorage.setItem('admin_form_data', JSON.stringify(formData));
    };
    reader.readAsDataURL(file);
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const fileData = {
            name: file.name,
            size: file.size,
            type: file.type,
            data: e.target.result
        };
        showFilePreview(fileData);
        
        // Save to formData temporarily
        const formData = JSON.parse(localStorage.getItem('admin_form_data') || '{}');
        formData.file = fileData;
        localStorage.setItem('admin_form_data', JSON.stringify(formData));
    };
    reader.readAsDataURL(file);
}

function showImagePreview(type, imageData) {
    const previewId = type === 'main' ? 'preview-main' : 'preview-highlight';
    const preview = document.getElementById(previewId);
    if (preview) {
        preview.innerHTML = `
            <img src="${imageData}" alt="Preview">
            <button type="button" class="remove-file-btn" onclick="removeImage('${type}')" style="margin-top: 10px;">Remover Imagem</button>
        `;
    }
}

function showFilePreview(fileData) {
    const preview = document.getElementById('preview-file');
    if (preview) {
        const sizeKB = (fileData.size / 1024).toFixed(2);
        preview.innerHTML = `
            <div class="file-preview-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                <span>${fileData.name} (${sizeKB} KB)</span>
                <button type="button" class="remove-file-btn" onclick="removeFile()">Remover</button>
            </div>
        `;
    }
}

window.removeImage = function(type) {
    const previewId = type === 'main' ? 'preview-main' : 'preview-highlight';
    const preview = document.getElementById(previewId);
    if (preview) {
        preview.innerHTML = '';
    }
    
    const inputId = type === 'main' ? 'form-image-main' : 'form-image-highlight';
    const input = document.getElementById(inputId);
    if (input) {
        input.value = '';
    }
    
    const formData = JSON.parse(localStorage.getItem('admin_form_data') || '{}');
    if (type === 'main') {
        delete formData.imageMain;
    } else if (type === 'highlight') {
        delete formData.imageHighlight;
    }
    localStorage.setItem('admin_form_data', JSON.stringify(formData));
};

window.removeFile = function() {
    const preview = document.getElementById('preview-file');
    if (preview) {
        preview.innerHTML = '';
    }
    
    const input = document.getElementById('form-file');
    if (input) {
        input.value = '';
    }
    
    const formData = JSON.parse(localStorage.getItem('admin_form_data') || '{}');
    delete formData.file;
    localStorage.setItem('admin_form_data', JSON.stringify(formData));
};

async function saveFormData() {
    // Get existing formData to preserve images and files
    const existingData = await getFormConfig();
    
    const formData = {
        title: document.getElementById('form-title').value,
        subtitle: document.getElementById('form-subtitle').value,
        highlightTitle: document.getElementById('form-highlight-title').value,
        highlightSubtitle: document.getElementById('form-highlight-subtitle').value,
        time: document.getElementById('form-time').value,
        // Preserve images and files
        imageMain: existingData.imageMain || null,
        imageHighlight: existingData.imageHighlight || null,
        file: existingData.file || null
    };
    
    await saveFormConfig(formData);
    alert('Formulário salvo com sucesso! As alterações serão aplicadas na homepage.');
}

// Armazenar participantes globalmente para uso em outras funções
let globalParticipants = [];

// Participantes (para visualização simples - sem checkboxes)
async function loadParticipantes() {
    try {
        console.log('🔄 Carregando participantes...');
        const participantes = await getAllParticipants();
        console.log(`✅ Total de participantes recebidos: ${participantes.length}`);
        
        globalParticipants = participantes; // Salvar globalmente
        
        // Normalizar dados (Supabase usa created_at, localStorage usa timestamp)
        const normalized = participantes.map(p => ({
            ...p,
            nome: p.nome || 'Sem nome',
            celular: p.celular || 'Sem celular',
            timestamp: p.created_at || p.timestamp || new Date().toISOString(),
            device: p.device || (/Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop')
        }));
        
        console.log(`📊 Participantes normalizados: ${normalized.length}`);
        
        const totalEl = document.getElementById('total-participantes');
        const hojeEl = document.getElementById('hoje-participantes');
        
        if (totalEl) totalEl.textContent = normalized.length;
        
        if (hojeEl) {
            const today = new Date().toDateString();
            const hoje = normalized.filter(p => {
                const dateStr = p.created_at || p.timestamp;
                if (!dateStr) return false;
                return new Date(dateStr).toDateString() === today;
            }).length;
            hojeEl.textContent = hoje;
        }
        
        const container = document.getElementById('participantes-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (normalized.length === 0) {
            container.innerHTML = '<div class="participante-item"><p>Nenhum participante ainda.</p></div>';
            return;
        }
        
        // Ordenar por data mais recente
        normalized.sort((a, b) => {
            const dateA = new Date(a.created_at || a.timestamp || 0);
            const dateB = new Date(b.created_at || b.timestamp || 0);
            return dateB - dateA;
        });
        
        normalized.forEach(participante => {
            const item = document.createElement('div');
            item.className = 'participante-item';
            const dateStr = formatDate(participante.created_at || participante.timestamp);
            const deviceIcon = participante.device === 'mobile' ? '📱' : '💻';
            
            item.innerHTML = `
                <div class="participante-info">
                    <h4>${participante.nome} ${deviceIcon}</h4>
                    <p>${participante.celular}</p>
                </div>
                <div class="participante-date">${dateStr}</div>
            `;
            container.appendChild(item);
        });
        
        console.log('Participantes carregados:', normalized.length);
    } catch (error) {
        console.error('Erro ao carregar participantes:', error);
        const container = document.getElementById('participantes-list');
        if (container) {
            container.innerHTML = '<div class="participante-item"><p>Erro ao carregar participantes. Tente atualizar.</p></div>';
        }
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Data não disponível';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Data inválida';
        return date.toLocaleString('pt-BR');
    } catch (e) {
        return 'Data inválida';
    }
}

// Ganhadores - Lista com checkboxes para selecionar
async function loadGanhadores() {
    try {
        const participantes = await getAllParticipants();
        globalParticipants = participantes; // Salvar globalmente
        
        // Atualizar estatísticas
        const totalEl = document.getElementById('total-participantes');
        const hojeEl = document.getElementById('hoje-participantes');
        
        if (totalEl) totalEl.textContent = participantes.length;
        
        if (hojeEl) {
            const today = new Date().toDateString();
            const hoje = participantes.filter(p => {
                const dateStr = p.created_at || p.timestamp;
                if (!dateStr) return false;
                return new Date(dateStr).toDateString() === today;
            }).length;
            hojeEl.textContent = hoje;
        }
        
        const winners = await getWinners();
        const container = document.getElementById('participantes-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (participantes.length === 0) {
            container.innerHTML = '<div class="participante-item"><p>Nenhum participante disponível.</p></div>';
            return;
        }
        
        // Normalizar dados
        const normalized = participantes.map(p => ({
            ...p,
            celular: p.celular || '',
            timestamp: p.created_at || p.timestamp || new Date().toISOString(),
            device: p.device || 'desktop'
        }));
        
        // Ordenar por data mais recente
        normalized.sort((a, b) => {
            const dateA = new Date(a.created_at || a.timestamp || 0);
            const dateB = new Date(b.created_at || b.timestamp || 0);
            return dateB - dateA;
        });
        
        normalized.forEach((participante, index) => {
            const participantPhone = (participante.celular || '').replace(/\D/g, '');
            const isWinner = winners.some(w => {
                const winnerPhone = (w.celular || '').replace(/\D/g, '');
                return winnerPhone === participantPhone;
            });
            
            const item = document.createElement('div');
            item.className = 'participante-item';
            const deviceIcon = participante.device === 'mobile' ? '📱' : '💻';
            const dateStr = formatDate(participante.created_at || participante.timestamp);
            const uniqueId = `winner-${index}-${participantPhone}`;
            
            item.innerHTML = `
                <div class="participante-info" style="flex: 1;">
                    <h4>${participante.nome} ${deviceIcon}</h4>
                    <p>${participante.celular}</p>
                    <small style="color: #999; font-size: 12px;">${dateStr}</small>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" id="${uniqueId}" data-index="${index}" class="winner-checkbox" ${isWinner ? 'checked' : ''}>
                    <label for="${uniqueId}" style="cursor: pointer; margin: 0;">Selecionar</label>
                </div>
            `;
            
            const checkbox = item.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', updateSelectedWinners);
            container.appendChild(item);
        });
        
        // Atualizar lista de selecionados
        updateSelectedWinners();
        console.log('✅ Ganhadores carregados. Participantes:', normalized.length, 'Ganhadores:', winners.length);
    } catch (error) {
        console.error('❌ Erro ao carregar ganhadores:', error);
        const container = document.getElementById('participantes-list');
        if (container) {
            container.innerHTML = '<div class="participante-item"><p>Erro ao carregar participantes. Tente atualizar.</p></div>';
        }
    }
}

function filterParticipantes() {
    const search = document.getElementById('search-participante').value.toLowerCase();
    const items = document.querySelectorAll('.participante-item');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(search) ? 'flex' : 'none';
    });
}

let selectedWinners = [];

async function updateSelectedWinners() {
    // Buscar participantes (pode ser do Supabase ou localStorage)
    let participantes = globalParticipants;
    if (participantes.length === 0) {
        participantes = await getAllParticipants();
        globalParticipants = participantes;
    }
    
    // Se ainda estiver vazio, usar localStorage como fallback
    if (participantes.length === 0) {
        participantes = JSON.parse(localStorage.getItem('webinar_participantes') || '[]');
    }
    
    const checkboxes = document.querySelectorAll('#participantes-list input[type="checkbox"]:checked');
    
    selectedWinners = Array.from(checkboxes).map(cb => {
        const index = parseInt(cb.getAttribute('data-index'));
        if (participantes[index]) {
            return {
                id: participantes[index].id || null,
                nome: participantes[index].nome,
                celular: participantes[index].celular,
                device: participantes[index].device || 'desktop'
            };
        }
        return null;
    }).filter(w => w !== null);
    
    renderSelectedWinners();
}

function renderSelectedWinners() {
    const container = document.getElementById('winners-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (selectedWinners.length === 0) {
        container.innerHTML = '<p class="empty-winners">Nenhum ganhador selecionado ainda.</p>';
        return;
    }
    
    selectedWinners.forEach((winner, index) => {
        const badge = document.createElement('div');
        badge.className = 'winner-badge';
        badge.innerHTML = `
            <span>${winner.nome} - ${winner.celular}</span>
            <button class="remove-winner" onclick="removeWinner(${index})">Remover</button>
        `;
        container.appendChild(badge);
    });
}

// Make it globally accessible
window.removeWinner = async function(index) {
    const winner = selectedWinners[index];
    if (!winner) return;
    
    const checkboxes = document.querySelectorAll('#participantes-list input[type="checkbox"]');
    
    // Encontrar e desmarcar o checkbox correspondente
    checkboxes.forEach(cb => {
        const idx = parseInt(cb.getAttribute('data-index'));
        const participant = globalParticipants[idx];
        if (participant && (participant.celular || '').replace(/\D/g, '') === (winner.celular || '').replace(/\D/g, '')) {
            cb.checked = false;
        }
    });
    
    await updateSelectedWinners();
};

async function confirmWinners() {
    if (selectedWinners.length === 0) {
        alert('Selecione pelo menos um ganhador!');
        return;
    }
    
    // Normalizar celulares antes de salvar
    const normalizedWinners = selectedWinners.map(w => ({
        ...w,
        celular: w.celular || '', // Garantir que não seja undefined
        celular_normalizado: (w.celular || '').replace(/\D/g, '')
    }));
    
    console.log('💾 Salvando ganhadores normalizados:', normalizedWinners);
    
    const confirmMessage = `Confirmar ${normalizedWinners.length} ganhador(es) do sorteio?\n\n${normalizedWinners.map(w => `- ${w.nome} (${w.celular})`).join('\n')}`;
    
    if (confirm(confirmMessage)) {
        const success = await saveWinners(normalizedWinners);
        
        if (success) {
            // Verificar se foi salvo corretamente
            const saved = JSON.parse(localStorage.getItem('webinar_winners') || '[]');
            console.log('✅ Ganhadores salvos. Verificação:', saved);
            
            // IMPORTANTE: Forçar atualização do timestamp para disparar verificação
            const timestamp = Date.now();
            localStorage.setItem('webinar_winners_timestamp', timestamp.toString());
            
            // DISPARAR TODOS OS EVENTOS IMEDIATAMENTE - SEM DELAY
            // 1. CustomEvent (mesma aba)
            const event = new CustomEvent('winners-confirmed', { 
                detail: { winners: normalizedWinners, timestamp: timestamp } 
            });
            window.dispatchEvent(event);
            console.log('📢 Evento winners-confirmed disparado IMEDIATAMENTE');
            
            // 2. BroadcastChannel (outras abas)
            try {
                const channel = new BroadcastChannel('winner-notifications');
                channel.postMessage({
                    type: 'winners-updated',
                    winners: normalizedWinners,
                    timestamp: timestamp,
                    action: 'check-now'
                });
                console.log('📢 BroadcastChannel message enviado IMEDIATAMENTE');
            } catch (e) {
                console.warn('BroadcastChannel não disponível:', e);
            }
            
            // 3. Forçar storage event (funciona entre abas)
            try {
                // Simular storage event disparando manualmente
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'webinar_winners',
                    newValue: JSON.stringify(normalizedWinners),
                    oldValue: saved.length > 0 ? JSON.stringify(saved) : null,
                    storageArea: localStorage
                }));
                console.log('📢 StorageEvent (winners) disparado IMEDIATAMENTE');
            } catch (e) {
                console.warn('Erro ao criar StorageEvent:', e);
            }
            
            // 4. Disparar evento de timestamp também
            try {
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'webinar_winners_timestamp',
                    newValue: timestamp.toString(),
                    oldValue: localStorage.getItem('webinar_winners_timestamp'),
                    storageArea: localStorage
                }));
                console.log('📢 StorageEvent (timestamp) disparado IMEDIATAMENTE');
            } catch (e) {
                console.warn('Erro ao criar StorageEvent timestamp:', e);
            }
            
            // 5. DISPARAR POPUP DE OFERTA PARA TODOS OS USUÁRIOS
            console.log('========================================');
            console.log('🔥 DISPARANDO POPUP DE OFERTA PARA TODOS! 🔥');
            console.log('========================================');
            
            // Disparar evento customizado para popup de oferta (mesma aba) - IMEDIATAMENTE
            const offerEvent = new CustomEvent('show-offer-popup', { 
                detail: { timestamp: timestamp, force: true } 
            });
            window.dispatchEvent(offerEvent);
            console.log('📢 Evento show-offer-popup disparado (mesma aba)');
            
            // BroadcastChannel (outras abas)
            try {
                const offerChannel = new BroadcastChannel('offer-popup');
                offerChannel.postMessage({
                    type: 'show-offer',
                    timestamp: timestamp,
                    action: 'show-now',
                    force: true
                });
                console.log('📢 Popup de oferta disparado via BroadcastChannel (outras abas)!');
            } catch (e) {
                console.warn('❌ Erro ao disparar popup de oferta via BroadcastChannel:', e);
            }
            
            // Backup: disparar novamente após 300ms
            setTimeout(() => {
                console.log('🔄 Backup: Disparando popup de oferta novamente...');
                window.dispatchEvent(new CustomEvent('show-offer-popup', { 
                    detail: { timestamp: timestamp, force: true } 
                }));
                try {
                    const offerChannel = new BroadcastChannel('offer-popup');
                    offerChannel.postMessage({
                        type: 'show-offer',
                        timestamp: timestamp,
                        action: 'show-now',
                        force: true
                    });
                } catch (e) {}
            }, 300);
            
            // 6. Log final para debug
            console.log('========================================');
            console.log('✅ GANHADORES CONFIRMADOS:');
            normalizedWinners.forEach((w, idx) => {
                console.log(`  ${idx + 1}. ${w.nome} - ${w.celular} (normalizado: ${(w.celular || '').replace(/\D/g, '')})`);
            });
            console.log('📦 Verificar no localStorage: webinar_winners');
            console.log('========================================');
            
            // Forçar uma verificação adicional após 500ms (caso os eventos não tenham chegado)
            setTimeout(() => {
                console.log('🔄 Verificação adicional após 500ms...');
                // Disparar evento novamente como backup
                const backupEvent = new CustomEvent('winners-confirmed', { 
                    detail: { winners: normalizedWinners, timestamp: timestamp, force: true } 
                });
                window.dispatchEvent(backupEvent);
            }, 500);
            
            alert(`✅ Ganhadores confirmados!\n\n${normalizedWinners.length} ganhador(es) verão a notificação AGORA!\n\nO popup de oferta aparecerá para TODOS os usuários no site!\n\nGanhadores:\n${normalizedWinners.map(w => `• ${w.nome} - ${w.celular}`).join('\n')}\n\n💡 Dica: Se não aparecer, abra o console (F12) na aba do webinar e execute: debugWinner()`);
        } else {
            alert('⚠️ Erro ao salvar ganhadores. Tente novamente.');
        }
    }
}

// Editor de Comentários
function switchComentariosTab(tabType) {
    document.querySelectorAll('.editor-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.comentarios-editor-panel').forEach(panel => panel.classList.remove('active'));
    
    const tab = document.querySelector(`.editor-tab[data-tab="${tabType}"]`);
    const panel = document.getElementById(`editor-${tabType}`);
    if (tab) tab.classList.add('active');
    if (panel) panel.classList.add('active');
}

async function loadComentariosEditor() {
    const comentarios = await getComments();
    
    const animacao = comentarios.animacao || [
        'Que sorteio incrível! Quero muito ganhar esse iPhone!',
        'Estou participando! Seria um sonho ganhar!',
        'Finalmente um sorteio de verdade! Torcendo muito!',
        'Meu celular está quebrado, seria perfeito ganhar!',
        'iPhone é tudo de bom! Estou dentro!',
        'Que oportunidade incrível! Vou ganhar!',
        'Sonhando com esse iPhone! Seria perfeito!',
        'Estou animado demais com esse sorteio!'
    ];
    
    const tristes = comentarios.tristes || [
        'Que triste, perdi o sorteio de novo...',
        'Sempre participo mas nunca ganho nada 😢',
        'Parece que não é pra mim mesmo...',
        'Mais um sorteio que vou perder, certeza',
        'Já desisti de ganhar alguma coisa',
        'Sempre vejo outros ganhando, menos eu',
        'Será que um dia eu vou ganhar?',
        'Tô triste, mais uma vez não fui sorteado'
    ];
    
    renderComentariosEditor('animacao', animacao);
    renderComentariosEditor('tristes', tristes);
}

function renderComentariosEditor(type, comentarios) {
    const container = document.getElementById(type + '-comentarios-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    comentarios.forEach((comentario, index) => {
        const item = document.createElement('div');
        item.className = 'comentario-edit-item';
        item.innerHTML = `
            <input type="text" value="${comentario}" data-type="${type}" data-index="${index}">
            <button class="remove-comentario-editor-btn" onclick="removeComentarioEditor('${type}', ${index})">Remover</button>
        `;
        container.appendChild(item);
    });
}

function addComentarioEditor(type) {
    const comentarios = getComentariosByTypeEditor(type);
    comentarios.push('');
    saveComentariosToStorage(type, comentarios);
    renderComentariosEditor(type, comentarios);
}

// Make it globally accessible
window.removeComentarioEditor = function(type, index) {
    const comentarios = getComentariosByTypeEditor(type);
    comentarios.splice(index, 1);
    saveComentariosToStorage(type, comentarios);
    renderComentariosEditor(type, comentarios);
};

function getComentariosByTypeEditor(type) {
    const container = document.getElementById(type + '-comentarios-list');
    if (!container) return [];
    const inputs = container.querySelectorAll('input');
    return Array.from(inputs).map(input => input.value.trim()).filter(v => v);
}

function saveComentariosToStorage(type, comentarios) {
    const allComentarios = JSON.parse(localStorage.getItem('admin_comentarios') || '{}');
    allComentarios[type] = comentarios;
    localStorage.setItem('admin_comentarios', JSON.stringify(allComentarios));
}

async function saveComentariosEditor() {
    const comentarios = {
        animacao: getComentariosByTypeEditor('animacao'),
        tristes: getComentariosByTypeEditor('tristes')
    };
    
    await saveComments(comentarios);
    alert('Comentários salvos com sucesso!');
}

// Mensagem de Ganhador
async function loadWinnerMessage() {
    try {
        const config = await getWinnerMessageConfig();
        
        const tituloEl = document.getElementById('winner-titulo');
        const subtituloEl = document.getElementById('winner-subtitulo');
        const mensagemEl = document.getElementById('winner-mensagem');
        const detalhesEl = document.getElementById('winner-detalhes');
        const botaoTextoEl = document.getElementById('winner-botao-texto');
        const botaoLinkEl = document.getElementById('winner-botao-link');
        
        if (tituloEl) tituloEl.value = config.titulo || 'PARABÉNS!';
        if (subtituloEl) subtituloEl.value = config.subtitulo || 'Você Ganhou o iPhone!';
        if (mensagemEl) mensagemEl.value = config.mensagem || 'Você foi selecionado(a) como um dos ganhadores do sorteio!';
        if (detalhesEl) detalhesEl.value = config.detalhes || 'Entre em contato conosco para receber seu prêmio!';
        if (botaoTextoEl) botaoTextoEl.value = config.botaoTexto || 'Resgatar Prêmio';
        if (botaoLinkEl) botaoLinkEl.value = config.botaoLink || '#';
    } catch (error) {
        console.error('Erro ao carregar mensagem de ganhador:', error);
    }
}

async function saveWinnerMessage() {
    const config = {
        titulo: document.getElementById('winner-titulo').value.trim() || 'PARABÉNS!',
        subtitulo: document.getElementById('winner-subtitulo').value.trim() || 'Você Ganhou o iPhone!',
        mensagem: document.getElementById('winner-mensagem').value.trim() || 'Você foi selecionado(a) como um dos ganhadores do sorteio!',
        detalhes: document.getElementById('winner-detalhes').value.trim() || 'Entre em contato conosco para receber seu prêmio!',
        botaoTexto: document.getElementById('winner-botao-texto').value.trim() || 'Resgatar Prêmio',
        botaoLink: document.getElementById('winner-botao-link').value.trim() || '#'
    };
    
    const success = await saveWinnerMessageConfig(config);
    if (success) {
        alert('✅ Mensagem de ganhador salva com sucesso!');
    } else {
        alert('⚠️ Erro ao salvar mensagem. Tente novamente.');
    }
}

// Configuração de Vídeo
async function loadVideoConfig() {
    try {
        const config = await getVideoConfig();
        
        const embedCodeEl = document.getElementById('video-embed-code');
        if (embedCodeEl) {
            embedCodeEl.value = config.embedCode || '';
        }
    } catch (error) {
        console.error('Erro ao carregar configuração de vídeo:', error);
    }
}

// Disparar popup de oferta para todos - VERSÃO ULTRA FORÇADA
async function triggerOfferPopup() {
    if (!confirm('🔥 Disparar popup de oferta para TODOS os usuários no site agora?')) {
        return;
    }
    
    console.log('🔥🔥🔥🔥🔥 DISPARANDO POPUP PARA TODOS! 🔥🔥🔥🔥🔥');
    
    const timestamp = Date.now();
    
    // SALVAR NO SUPABASE (PRINCIPAL) - Isso alcança TODOS os usuários
    const result = await saveOfferPopupTrigger(timestamp);
    
    if (result && result.success) {
        console.log('✅✅✅ TIMESTAMP SALVO NO SUPABASE - TODOS OS USUÁRIOS RECEBERÃO! ✅✅✅');
        console.log('📊 ID do disparo:', result.disparoId);
    } else {
        console.warn('⚠️ Não foi possível salvar no Supabase, usando apenas localStorage');
    }
    
    // Salvar timestamp no localStorage também (para resposta imediata local)
    localStorage.setItem('last_offer_popup', timestamp.toString());
    localStorage.setItem('current_offer_disparo_id', timestamp.toString());
    
    // Disparar na mesma aba - IMEDIATAMENTE
    const offerEvent = new CustomEvent('show-offer-popup', { 
        detail: { timestamp: timestamp, force: true } 
    });
    window.dispatchEvent(offerEvent);
    document.dispatchEvent(offerEvent); // Backup
    console.log('✅ Evento disparado na mesma aba (window + document)');
    
    // BroadcastChannel para outras abas (mesma máquina)
    try {
        const channel = new BroadcastChannel('offer-popup');
        channel.postMessage({
            type: 'show-offer',
            timestamp: timestamp,
            force: true
        });
        console.log('✅ Evento disparado via BroadcastChannel');
    } catch (e) {
        console.warn('BroadcastChannel erro:', e);
    }
    
    // Storage event para outras abas (backup)
    try {
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'last_offer_popup',
            newValue: timestamp.toString(),
            oldValue: localStorage.getItem('last_offer_popup'),
            storageArea: localStorage
        }));
        console.log('✅ StorageEvent disparado');
    } catch (e) {}
    
    // Atualizar contagem após 2 segundos (dar tempo para os usuários receberem)
    setTimeout(async () => {
        if (typeof getOfferDeliveryCount === 'function' && result && result.disparoId) {
            const count = await getOfferDeliveryCount(result.disparoId);
            console.log(`📊 Contagem de entregas até agora: ${count} usuários`);
            
            // Atualizar botão ou mostrar contagem se necessário
            const triggerBtn = document.querySelector('[onclick*="triggerOfferPopup"]') || 
                              document.querySelector('button:contains("Disparar Oferta")');
            if (triggerBtn && count > 0) {
                const originalText = triggerBtn.textContent.replace(/ \(\d+\)$/, '');
                triggerBtn.textContent = `${originalText} (${count} entregas)`;
            }
        }
    }, 2000);
    
    alert('✅ Popup disparado!\n\nO popup será enviado para TODOS os usuários através do Supabase.\n\nUsuários em diferentes dispositivos/navegadores receberão em até 1 segundo.\n\nA contagem de entregas será atualizada automaticamente.');
}

// Configuração de Oferta
async function loadOfferConfig() {
    try {
        const config = await getOfferConfig();
        
        const iconEl = document.getElementById('offer-icon-input');
        const titleEl = document.getElementById('offer-title-input');
        const subtitleEl = document.getElementById('offer-subtitle-input');
        const messageEl = document.getElementById('offer-message-input');
        const detailsEl = document.getElementById('offer-details-input');
        const ctaTextEl = document.getElementById('offer-cta-text-input');
        const ctaLinkEl = document.getElementById('offer-cta-link-input');
        
        if (iconEl) iconEl.value = config.icon || '🔥';
        if (titleEl) titleEl.value = config.titulo || 'Oferta Especial';
        if (subtitleEl) subtitleEl.value = config.subtitulo || 'Aproveite Agora!';
        if (messageEl) messageEl.value = config.mensagem || 'Não perca esta oportunidade única!';
        if (detailsEl) detailsEl.value = config.detalhes || 'Confira nossa oferta especial!';
        if (ctaTextEl) ctaTextEl.value = config.ctaTexto || 'Quero Aproveitar';
        if (ctaLinkEl) {
            ctaLinkEl.value = (config.ctaLink && config.ctaLink !== '#') ? config.ctaLink : '';
            // Normalizar URL automaticamente ao colar ou digitar
            ctaLinkEl.addEventListener('blur', function() {
                if (this.value.trim() && this.value.trim() !== '#') {
                    this.value = normalizeUrl(this.value.trim());
                }
            });
            // Normalizar ao colar
            ctaLinkEl.addEventListener('paste', function(e) {
                setTimeout(() => {
                    if (this.value.trim() && this.value.trim() !== '#') {
                        this.value = normalizeUrl(this.value.trim());
                    }
                }, 10);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar configuração de oferta:', error);
    }
}

async function saveOfferConfigHandler() {
    const config = {
        icon: document.getElementById('offer-icon-input').value.trim() || '',
        titulo: document.getElementById('offer-title-input').value.trim() || '',
        subtitulo: document.getElementById('offer-subtitle-input').value.trim() || '',
        mensagem: document.getElementById('offer-message-input').value.trim() || '',
        detalhes: document.getElementById('offer-details-input').value.trim() || 'Confira nossa oferta especial!',
        ctaTexto: document.getElementById('offer-cta-text-input').value.trim() || 'Quero Aproveitar',
        ctaLink: (() => {
            const linkValue = document.getElementById('offer-cta-link-input').value.trim();
            if (!linkValue || linkValue === '#') return '#';
            return normalizeUrl(linkValue);
        })()
    };
    
    const success = await saveOfferConfig(config);
    if (success) {
        alert('✅ Configuração de oferta salva com sucesso!');
    } else {
        alert('⚠️ Erro ao salvar configuração. Tente novamente.');
    }
}

async function saveVideoConfigHandler() {
    const embedCode = document.getElementById('video-embed-code').value.trim();
    
    if (!embedCode) {
        alert('⚠️ Por favor, insira o código embed do vídeo!');
        return;
    }
    
    const config = {
        embedCode: embedCode
    };
    
    const success = await saveVideoConfig(config);
    if (success) {
        alert('✅ Configuração de vídeo salva com sucesso!');
    } else {
        alert('⚠️ Erro ao salvar configuração. Tente novamente.');
    }
}