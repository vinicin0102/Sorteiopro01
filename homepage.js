// Load form data from admin
async function loadFormData() {
    const formData = await getFormConfig();
    
    const titleEl = document.getElementById('form-main-title');
    const subtitleEl = document.getElementById('form-subtitle-text');
    const highlightTitleEl = document.getElementById('form-highlight-title-text');
    const highlightSubtitleEl = document.getElementById('form-highlight-subtitle-text');
    const timeEl = document.getElementById('form-time-text');
    
    // Atualizar textos - sempre usar dados do admin, mesmo se vazios
    if (titleEl) titleEl.textContent = formData.title || '';
    if (subtitleEl) subtitleEl.textContent = formData.subtitle || '';
    if (highlightTitleEl) highlightTitleEl.textContent = formData.highlightTitle || '';
    if (highlightSubtitleEl) highlightSubtitleEl.textContent = formData.highlightSubtitle || '';
    if (timeEl) timeEl.textContent = formData.time || '';
    
    // Atualizar info-title também (se existir no formData)
    const infoTitleEl = document.querySelector('.info-title');
    if (infoTitleEl) {
        // Se não houver infoTitle no formData, deixar vazio ou usar um padrão
        infoTitleEl.textContent = formData.infoTitle || '';
    }
    
    // Load images
    const mainImageContainer = document.getElementById('main-image-container');
    if (mainImageContainer && formData.imageMain) {
        mainImageContainer.innerHTML = `<img src="${formData.imageMain}" alt="Imagem Principal">`;
    } else if (mainImageContainer) {
        mainImageContainer.innerHTML = '';
    }
    
    const highlightImageContainer = document.getElementById('highlight-image-container');
    if (highlightImageContainer && formData.imageHighlight) {
        highlightImageContainer.innerHTML = `<img src="${formData.imageHighlight}" alt="Imagem de Destaque">`;
    } else if (highlightImageContainer) {
        highlightImageContainer.innerHTML = '';
    }
    
    // Load file download link if exists
    // You can add file download functionality here if needed
}

// Phone mask
document.addEventListener('DOMContentLoaded', async function() {
    await loadFormData();
    const celularInput = document.getElementById('celular');
    
    // Apply phone mask
    celularInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        let formattedValue = '';
        
        if (value.length > 0) {
            formattedValue = '(' + value.substring(0, 2);
        }
        if (value.length > 2) {
            formattedValue += ') ' + value.substring(2, 7);
        }
        if (value.length > 7) {
            formattedValue += '-' + value.substring(7, 11);
        }
        
        e.target.value = formattedValue;
    });

    // Form submission
    const form = document.getElementById('registration-form');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const nome = document.getElementById('nome').value.trim();
        const celular = document.getElementById('celular').value.trim();
        
        // Validate fields
        if (!nome || nome.length < 3) {
            alert('Por favor, insira seu nome completo');
            return;
        }
        
        if (!celular || celular.replace(/\D/g, '').length < 10) {
            alert('Por favor, insira um número de celular válido');
            return;
        }
        
        // Disable button and show loading
        const submitButton = document.querySelector('.submit-button');
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';
        
        // Save to database
        try {
            const participant = await saveParticipant(nome, celular);
            
            // Save to localStorage for current session
            localStorage.setItem('webinar_registration', JSON.stringify({
                nome: participant.nome || nome,
                celular: participant.celular || celular,
                timestamp: participant.created_at || participant.timestamp || new Date().toISOString(),
                device: participant.device || (/Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop')
            }));
            
            submitButton.textContent = 'Redirecionando...';
            
            // Redirect to webinar page after 1 second
            setTimeout(function() {
                window.location.href = 'webinar.html';
            }, 1000);
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar. Tente novamente ou verifique sua conexão.');
            submitButton.disabled = false;
            submitButton.textContent = 'Garantir Minha Vaga';
        }
    });
});
