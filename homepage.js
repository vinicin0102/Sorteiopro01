// Load form data from admin
function loadFormData() {
    const formData = JSON.parse(localStorage.getItem('admin_form_data') || '{}');
    
    const titleEl = document.getElementById('form-main-title');
    const subtitleEl = document.getElementById('form-subtitle-text');
    const highlightTitleEl = document.getElementById('form-highlight-title-text');
    const highlightSubtitleEl = document.getElementById('form-highlight-subtitle-text');
    const timeEl = document.getElementById('form-time-text');
    
    if (titleEl && formData.title) titleEl.textContent = formData.title;
    if (subtitleEl && formData.subtitle) subtitleEl.textContent = formData.subtitle;
    if (highlightTitleEl && formData.highlightTitle) highlightTitleEl.textContent = formData.highlightTitle;
    if (highlightSubtitleEl && formData.highlightSubtitle) highlightSubtitleEl.textContent = formData.highlightSubtitle;
    if (timeEl && formData.time) timeEl.textContent = formData.time;
    
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
document.addEventListener('DOMContentLoaded', function() {
    loadFormData();
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
    
    form.addEventListener('submit', function(e) {
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
        
        // Save to localStorage
        const registrationData = {
            nome: nome,
            celular: celular,
            timestamp: new Date().toISOString(),
            device: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop'
        };
        
        // Save individual registration
        localStorage.setItem('webinar_registration', JSON.stringify(registrationData));
        
        // Add to participants list
        let participantes = JSON.parse(localStorage.getItem('webinar_participantes') || '[]');
        
        // Check if already registered (by phone)
        const phoneOnly = celular.replace(/\D/g, '');
        const alreadyExists = participantes.some(p => p.celular.replace(/\D/g, '') === phoneOnly);
        
        if (!alreadyExists) {
            participantes.push(registrationData);
            localStorage.setItem('webinar_participantes', JSON.stringify(participantes));
        }
        
        // Disable button and show loading
        const submitButton = document.querySelector('.submit-button');
        submitButton.disabled = true;
        submitButton.textContent = 'Redirecionando...';
        
        // Redirect to webinar page after 1 second
        setTimeout(function() {
            window.location.href = 'webinar.html';
        }, 1000);
    });
});
