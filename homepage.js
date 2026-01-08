// Load form data from admin
async function loadFormData() {
    const formData = await getFormConfig();
    
    const titleEl = document.getElementById('form-main-title');
    const subtitleEl = document.getElementById('form-subtitle-text');
    const highlightTitleEl = document.getElementById('form-highlight-title-text');
    const highlightSubtitleEl = document.getElementById('form-highlight-subtitle-text');
    const timeEl = document.getElementById('form-time-text');
    
    // Atualizar textos - ocultar elementos se estiverem vazios
    if (titleEl) {
        const titleValue = (formData.title || '').trim();
        if (titleValue) {
            titleEl.textContent = titleValue;
            titleEl.style.display = '';
        } else {
            titleEl.style.display = 'none';
        }
    }
    
    if (subtitleEl) {
        const subtitleValue = (formData.subtitle || '').trim();
        if (subtitleValue) {
            subtitleEl.textContent = subtitleValue;
            subtitleEl.style.display = '';
        } else {
            subtitleEl.style.display = 'none';
        }
    }
    
    if (highlightTitleEl) {
        const highlightTitleValue = (formData.highlightTitle || '').trim();
        if (highlightTitleValue) {
            highlightTitleEl.textContent = highlightTitleValue;
            highlightTitleEl.style.display = '';
        } else {
            highlightTitleEl.style.display = 'none';
        }
    }
    
    if (highlightSubtitleEl) {
        const highlightSubtitleValue = (formData.highlightSubtitle || '').trim();
        if (highlightSubtitleValue) {
            highlightSubtitleEl.textContent = highlightSubtitleValue;
            highlightSubtitleEl.style.display = '';
        } else {
            highlightSubtitleEl.style.display = 'none';
        }
    }
    
    if (timeEl) {
        const timeValue = (formData.time || '').trim();
        if (timeValue) {
            timeEl.textContent = timeValue;
            timeEl.style.display = '';
        } else {
            timeEl.style.display = 'none';
        }
    }
    
    // Atualizar info-title também (se existir no formData)
    const infoTitleEl = document.querySelector('.info-title');
    if (infoTitleEl) {
        const infoTitleValue = (formData.infoTitle || '').trim();
        if (infoTitleValue) {
            infoTitleEl.textContent = infoTitleValue;
            infoTitleEl.style.display = '';
        } else {
            infoTitleEl.style.display = 'none';
        }
    }
    
    // Ocultar highlight-box inteiro se todos os campos estiverem vazios
    const highlightBox = document.querySelector('.highlight-box');
    if (highlightBox) {
        const hasHighlightTitle = (formData.highlightTitle || '').trim();
        const hasHighlightSubtitle = (formData.highlightSubtitle || '').trim();
        const hasHighlightImage = formData.imageHighlight && formData.imageHighlight.trim();
        
        console.log('🔍 Verificando highlight-box:', {
            hasHighlightTitle,
            hasHighlightSubtitle,
            hasHighlightImage
        });
        
        if (!hasHighlightTitle && !hasHighlightSubtitle && !hasHighlightImage) {
            highlightBox.style.display = 'none';
            console.log('❌ highlight-box ocultado (todos campos vazios)');
        } else {
            highlightBox.style.display = '';
            console.log('✅ highlight-box visível');
        }
    }
    
    // Ocultar info-box inteiro se ambos os textos estiverem vazios
    const infoBox = document.querySelector('.info-box');
    if (infoBox) {
        const infoTitleEl = infoBox.querySelector('.info-title');
        const infoTimeEl = infoBox.querySelector('.info-time');
        const hasInfoTitle = infoTitleEl && (infoTitleEl.textContent || '').trim();
        const hasInfoTime = infoTimeEl && (infoTimeEl.textContent || '').trim();
        
        if (!hasInfoTitle && !hasInfoTime) {
            infoBox.style.display = 'none';
        } else {
            infoBox.style.display = '';
        }
    }
    
    // Load images - GARANTIR EXIBIÇÃO
    const mainImageContainer = document.getElementById('main-image-container');
    if (mainImageContainer) {
        if (formData.imageMain && formData.imageMain.trim()) {
            const imgUrl = formData.imageMain.trim();
            console.log('📸 Carregando imagem principal:', imgUrl);
            mainImageContainer.innerHTML = `<img src="${imgUrl}" alt="Imagem Principal" onerror="console.error('❌ Erro ao carregar imagem principal:', this.src); this.style.display='none';">`;
            mainImageContainer.style.display = '';
        } else {
            console.log('⚠️ Nenhuma imagem principal configurada');
            mainImageContainer.innerHTML = '';
            mainImageContainer.style.display = 'none';
        }
    }
    
    const highlightImageContainer = document.getElementById('highlight-image-container');
    if (highlightImageContainer) {
        if (formData.imageHighlight && formData.imageHighlight.trim()) {
            const imgUrl = formData.imageHighlight.trim();
            console.log('📸 Carregando imagem de destaque:', imgUrl);
            highlightImageContainer.innerHTML = `<img src="${imgUrl}" alt="Imagem de Destaque" onerror="console.error('❌ Erro ao carregar imagem de destaque:', this.src); this.style.display='none';">`;
            highlightImageContainer.style.display = '';
        } else {
            console.log('⚠️ Nenhuma imagem de destaque configurada');
            highlightImageContainer.innerHTML = '';
            highlightImageContainer.style.display = 'none';
        }
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
