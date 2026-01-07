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
    
    // Participantes e Ganhadores
    const searchInput = document.getElementById('search-participante');
    if (searchInput) {
        searchInput.addEventListener('input', filterGanhadores);
    }
    
    // Refresh participantes button
    const refreshBtn = document.getElementById('refresh-participantes');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.disabled = true;
            refreshBtn.textContent = '🔄 Atualizando...';
            await loadParticipantes();
            refreshBtn.disabled = false;
            refreshBtn.textContent = '🔄 Atualizar';
        });
    }
    
    const confirmBtn = document.getElementById('confirm-winners-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmWinners);
    }
}

function handleLogin() {
    const password = document.getElementById('admin-password').value;
    const errorMsg = document.getElementById('login-error');
    
    if (password === ADMIN_PASSWORD) {
        localStorage.setItem('admin_logged_in', 'true');
        showAdminPanel();
        errorMsg.classList.remove('show');
    } else {
        errorMsg.textContent = 'Senha incorreta!';
        errorMsg.classList.add('show');
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
        await loadParticipantes();
        // loadGanhadores será chamado quando necessário
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

// Get unique random name (ensures different names for each message)
const usedNames = new Set();

function getUniqueRandomName(participantes) {
    // Try to use real participant names first
    if (participantes.length > 0) {
        const availableParticipants = participantes.filter(p => !usedNames.has(p.nome));
        if (availableParticipants.length > 0) {
            const selected = availableParticipants[Math.floor(Math.random() * availableParticipants.length)];
            usedNames.add(selected.nome);
            return selected.nome.split(' ')[0]; // First name only
        }
    }
    
    // Use random names from list
    const availableNames = randomNames.filter(name => !usedNames.has(name));
    if (availableNames.length === 0) {
        // Reset if all names used
        usedNames.clear();
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
    
    for (let i = 0; i < quantity; i++) {
        // Cycle through messages or use random
        const messageIndex = i % shuffledMessages.length;
        const message = shuffledMessages[messageIndex] || shuffledMessages[Math.floor(Math.random() * shuffledMessages.length)];
        
        // Get unique name for each message
        const uniqueName = getUniqueRandomName(participantes);
        
        messages.push({
            username: uniqueName,
            message: message,
            timestamp: Date.now() + (i * 1000) // Stagger messages by 1 second
        });
    }
    
    // Store messages to be displayed
    const pendingMessages = JSON.parse(localStorage.getItem('webinar_pending_messages') || '[]');
    pendingMessages.push(...messages);
    localStorage.setItem('webinar_pending_messages', JSON.stringify(pendingMessages));
    
    // Trigger event or reload if webinar is open
    window.dispatchEvent(new CustomEvent('admin-messages-added'));
    
    alert(`Disparando ${quantity} comentário(s) ${type === 'tristes' ? 'tristes' : 'de animação'} com nomes diferentes!`);
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

// Participantes
async function loadParticipantes() {
    try {
        const participantes = await getAllParticipants();
        
        // Normalizar dados (Supabase usa created_at, localStorage usa timestamp)
        const normalized = participantes.map(p => ({
            ...p,
            timestamp: p.created_at || p.timestamp || new Date().toISOString(),
            device: p.device || 'desktop'
        }));
        
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

// Ganhadores
async function loadGanhadores() {
    try {
        const participantes = await getAllParticipants();
        const winners = await getWinners();
        
        const container = document.getElementById('participantes-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (participantes.length === 0) {
            container.innerHTML = '<p>Nenhum participante disponível.</p>';
            return;
        }
        
        // Normalizar dados
        const normalized = participantes.map(p => ({
            ...p,
            celular: p.celular || '',
            timestamp: p.created_at || p.timestamp || new Date().toISOString()
        }));
        
        normalized.forEach((participante, index) => {
            const participantPhone = (participante.celular || '').replace(/\D/g, '');
            const isWinner = winners.some(w => {
                const winnerPhone = (w.celular || '').replace(/\D/g, '');
                return winnerPhone === participantPhone;
            });
            
            const item = document.createElement('div');
            item.className = 'participante-item';
            const deviceIcon = participante.device === 'mobile' ? '📱' : '💻';
            
            item.innerHTML = `
                <div class="participante-info">
                    <h4>${participante.nome} ${deviceIcon}</h4>
                    <p>${participante.celular}</p>
                </div>
                <div>
                    <input type="checkbox" id="winner-${index}" data-index="${index}" ${isWinner ? 'checked' : ''}>
                    <label for="winner-${index}">Ganhador</label>
                </div>
            `;
            
            item.querySelector('input').addEventListener('change', updateSelectedWinners);
            container.appendChild(item);
        });
        
        updateSelectedWinners();
    } catch (error) {
        console.error('Erro ao carregar ganhadores:', error);
    }
}

function filterGanhadores() {
    const search = document.getElementById('search-participante').value.toLowerCase();
    const items = document.querySelectorAll('.participante-item');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(search) ? 'flex' : 'none';
    });
}

let selectedWinners = [];

function updateSelectedWinners() {
    const participantes = JSON.parse(localStorage.getItem('webinar_participantes') || '[]');
    const checkboxes = document.querySelectorAll('#participantes-list input[type="checkbox"]:checked');
    
    selectedWinners = Array.from(checkboxes).map(cb => {
        const index = parseInt(cb.getAttribute('data-index'));
        return participantes[index];
    });
    
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
window.removeWinner = function(index) {
    const participantes = JSON.parse(localStorage.getItem('webinar_participantes') || '[]');
    const checkboxes = document.querySelectorAll('#participantes-list input[type="checkbox"]');
    const winner = selectedWinners[index];
    
    // Uncheck the checkbox
    participantes.forEach((p, i) => {
        if (p.celular === winner.celular) {
            checkboxes[i].checked = false;
        }
    });
    
    updateSelectedWinners();
};

async function confirmWinners() {
    if (selectedWinners.length === 0) {
        alert('Selecione pelo menos um ganhador!');
        return;
    }
    
    if (confirm(`Confirmar ${selectedWinners.length} ganhador(es) do sorteio?`)) {
        await saveWinners(selectedWinners);
        
        // Force a storage event to trigger in all tabs
        localStorage.setItem('webinar_winners_timestamp', Date.now().toString());
        
        // Small delay to ensure storage is set
        setTimeout(() => {
            // Trigger custom event (works in same tab)
            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('winners-confirmed', { 
                    detail: { winners: selectedWinners } 
                }));
            }
        }, 100);
        
        alert(`Ganhadores confirmados com sucesso! Os ganhadores verão a notificação em tempo real. Total: ${selectedWinners.length}`);
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