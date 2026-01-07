// Get user registration data
let userName = 'Visitante';
let userPhone = '';
const registrationData = localStorage.getItem('webinar_registration');
if (registrationData) {
    try {
        const data = JSON.parse(registrationData);
        userName = data.nome || 'Visitante';
        userPhone = data.celular || '';
    } catch (e) {
        console.error('Error parsing registration data:', e);
    }
}

// Update greeting with user name
const greetingElement = document.querySelector('.greeting-bar span');
if (greetingElement) {
    greetingElement.textContent = `Olá, ${userName}`;
}

// Check if user is a winner (wrapper function)
async function checkIfWinnerWrapper() {
    if (!userPhone) return false;
    
    try {
        return await checkIfWinner(userPhone);
    } catch (error) {
        // Fallback para localStorage
        const winners = JSON.parse(localStorage.getItem('webinar_winners') || '[]');
        const userPhoneNormalized = userPhone.replace(/\D/g, '');
        return winners.some(winner => {
            const winnerPhoneNormalized = (winner.celular || '').replace(/\D/g, '');
            return winnerPhoneNormalized === userPhoneNormalized;
        });
    }
}

// Show winner modal
function showWinnerModal() {
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
async function checkWinnerStatus() {
    const isWinner = await checkIfWinnerWrapper();
    if (isWinner) {
        // Check if already shown
        const alreadyShown = localStorage.getItem('winner_shown_' + userPhone);
        if (!alreadyShown) {
            showWinnerModal();
            localStorage.setItem('winner_shown_' + userPhone, 'true');
        }
    }
}

// Check on page load (async)
(async function() {
    await checkWinnerStatus();
})();

// Listen for admin winner confirmations
window.addEventListener('storage', function(e) {
    if (e.key === 'webinar_winners') {
        checkWinnerStatus();
    }
});

// Also check periodically (in case of same-tab updates)
setInterval(async () => {
    await checkWinnerStatus();
}, 2000);

// Close button - attach event listener
setTimeout(() => {
    const closeBtn = document.getElementById('winner-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideWinnerModal);
    }
}, 100);

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
