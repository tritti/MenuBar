/**
 * Gestione della modalità Lavagna
 * 
 * Questo script gestisce l'attivazione/disattivazione della modalità Lavagna,
 * che cambia la visualizzazione del menu per sembrare scritta su una lavagna con gesso.
 * La modalità viene attivata dalla pagina admin e salvata in localStorage per permanere anche dopo il logout.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Controlla se la modalità Lavagna è attiva
    const isLavagnaMode = localStorage.getItem('lavagnaMode') === 'enabled';
    // Controlla se la modalità Kiosk è attiva
    const isKioskMode = localStorage.getItem('kioskMode') === 'enabled';
    
    // Controllo del parametro URL per la modalità lavagna
    const urlParams = new URLSearchParams(window.location.search);
    const lavagnaParam = urlParams.get('lavagna');
    const kioskParam = urlParams.get('kiosk');
    
    // Se il parametro è presente, imposta la modalità di conseguenza
    if (lavagnaParam === 'true' || lavagnaParam === '1') {
        localStorage.setItem('lavagnaMode', 'enabled');
    } else if (lavagnaParam === 'false' || lavagnaParam === '0') {
        localStorage.setItem('lavagnaMode', 'disabled');
    }
    
    // Gestione parametro kiosk
    if (kioskParam === 'true' || kioskParam === '1') {
        localStorage.setItem('kioskMode', 'enabled');
    } else if (kioskParam === 'false' || kioskParam === '0') {
        localStorage.setItem('kioskMode', 'disabled');
    }
    
    // Previeni il flash quando si cambia pagina aggiungendo una classe transitoria al tag HTML
    function preventFlash() {
        // Aggiungi classi di transizione per entrambe le modalità
        const currentLavagnaMode = localStorage.getItem('lavagnaMode') === 'enabled';
        const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
        
        if (currentLavagnaMode) {
            document.documentElement.classList.add('lavagna-transitioning');
        }
        
        if (isDarkMode) {
            document.documentElement.classList.add('dark-transitioning');
        }
    }
    
    // Intercetta tutti i click su link per prevenire il flash
    document.addEventListener('click', function(e) {
        // Trova il link più vicino se c'è
        let link = e.target.closest('a');
        if (link && link.href && !link.target && !e.ctrlKey && !e.metaKey && 
            !link.href.startsWith('javascript:') && !link.href.includes('#')) {
            preventFlash();
        }
    });
    
    // Intercetta tutti i submit di form per prevenire il flash
    document.addEventListener('submit', function(e) {
        preventFlash();
    });
    
    // Applica prevenzione flash all'avvio
    if (document.readyState === 'loading') {
        preventFlash();
    }
    
    // Funzione per impostare la modalità Lavagna
    function setLavagnaMode(enabled) {
        if (enabled) {
            document.body.classList.add('lavagna-mode');
            localStorage.setItem('lavagnaMode', 'enabled');
            
            // Se siamo nella pagina admin, aggiorna lo stato del pulsante
            const toggleButton = document.getElementById('lavagnaToggle');
            if (toggleButton) {
                toggleButton.classList.remove('btn-outline-secondary');
                toggleButton.classList.add('btn-success');
                toggleButton.querySelector('span').textContent = 'Attiva';
            }
        } else {
            document.body.classList.remove('lavagna-mode');
            localStorage.setItem('lavagnaMode', 'disabled');
            
            // Se siamo nella pagina admin, aggiorna lo stato del pulsante
            const toggleButton = document.getElementById('lavagnaToggle');
            if (toggleButton) {
                toggleButton.classList.remove('btn-success');
                toggleButton.classList.add('btn-outline-secondary');
                toggleButton.querySelector('span').textContent = 'Disattiva';
            }
        }
    }
    
    // Funzione per impostare la modalità Kiosk
    function setKioskMode(enabled) {
        if (enabled) {
            document.body.classList.add('kiosk-mode');
            localStorage.setItem('kioskMode', 'enabled');
            
            // Se siamo nella pagina admin, aggiorna lo stato del pulsante
            const kioskButton = document.getElementById('kioskToggle');
            if (kioskButton) {
                kioskButton.classList.remove('btn-outline-secondary');
                kioskButton.classList.add('btn-success');
                kioskButton.querySelector('span').textContent = 'Attiva';
            }
            
            // Nascondi elementi non necessari in modalità kiosk
            hideNonEssentialElements();
        } else {
            document.body.classList.remove('kiosk-mode');
            localStorage.setItem('kioskMode', 'disabled');
            
            // Se siamo nella pagina admin, aggiorna lo stato del pulsante
            const kioskButton = document.getElementById('kioskToggle');
            if (kioskButton) {
                kioskButton.classList.remove('btn-success');
                kioskButton.classList.add('btn-outline-secondary');
                kioskButton.querySelector('span').textContent = 'Disattiva';
            }
            
            // Ripristina elementi nascosti
            showAllElements();
        }
    }
    
    // Funzione per nascondere elementi non essenziali in modalità kiosk
    function hideNonEssentialElements() {
        // Nascondi navbar
        const navbar = document.querySelector('.navbar');
        if (navbar) navbar.style.display = 'none';
        
        // Nascondi footer se non è già nascosto
        const footer = document.querySelector('.footer');
        if (footer && footer.style.display !== 'none') {
            footer.style.display = 'none';
        }
        
        // Nascondi altri elementi non essenziali
        document.querySelectorAll('.admin-only, .non-kiosk').forEach(el => {
            el.style.display = 'none';
        });
        
        // Rimuovi margin top dal contenitore principale
        const mainContainer = document.querySelector('.container');
        if (mainContainer) {
            mainContainer.style.marginTop = '0';
            mainContainer.style.paddingTop = '0';
        }
        
        // Imposta a schermo intero
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Errore nella richiesta di fullscreen:', err.message);
            });
        }
    }
    
    // Funzione per ripristinare tutti gli elementi nascosti
    function showAllElements() {
        // Mostra navbar
        const navbar = document.querySelector('.navbar');
        if (navbar) navbar.style.display = '';
        
        // Mostra footer se non siamo in modalità lavagna
        if (localStorage.getItem('lavagnaMode') !== 'enabled') {
            const footer = document.querySelector('.footer');
            if (footer) footer.style.display = '';
        }
        
        // Mostra altri elementi nascosti
        document.querySelectorAll('.admin-only, .non-kiosk').forEach(el => {
            el.style.display = '';
        });
        
        // Ripristina margin top del contenitore principale
        const mainContainer = document.querySelector('.container');
        if (mainContainer) {
            mainContainer.style.marginTop = '';
            mainContainer.style.paddingTop = '';
        }
        
        // Esci da schermo intero
        if (document.exitFullscreen && document.fullscreenElement) {
            document.exitFullscreen().catch(err => {
                console.log('Errore nell\'uscita da fullscreen:', err.message);
            });
        }
    }
    
    // Rimuovi le classi transitorie dopo che la pagina è caricata
    function removeTransitionClasses() {
        document.documentElement.classList.remove('lavagna-transitioning');
        document.documentElement.classList.remove('dark-transitioning');
    }
    
    // Rimuovi all'evento load
    window.addEventListener('load', removeTransitionClasses);
    
    // Assicurati che vengano rimosse anche se viene chiamato DOMContentLoaded prima di load
    window.addEventListener('DOMContentLoaded', function() {
        // Rimuovi le classi con un piccolo ritardo per assicurarti che 
        // gli stili siano già applicati
        setTimeout(removeTransitionClasses, 50);
    });
    
    // Imposta la modalità in base allo stato salvato
    setLavagnaMode(isLavagnaMode);
    if (isKioskMode) setKioskMode(true);
    
    // Gestione del pulsante di toggle lavagna nella pagina admin
    const lavagnaToggle = document.getElementById('lavagnaToggle');
    if (lavagnaToggle) {
        // Imposta lo stato iniziale del pulsante
        if (isLavagnaMode) {
            lavagnaToggle.classList.remove('btn-outline-secondary');
            lavagnaToggle.classList.add('btn-success');
            lavagnaToggle.querySelector('span').textContent = 'Attiva';
        } else {
            lavagnaToggle.classList.remove('btn-success');
            lavagnaToggle.classList.add('btn-outline-secondary');
            lavagnaToggle.querySelector('span').textContent = 'Disattiva';
        }
        
        // Aggiungi event listener al pulsante
        lavagnaToggle.addEventListener('click', function() {
            const currentMode = localStorage.getItem('lavagnaMode');
            const newMode = currentMode === 'enabled' ? 'disabled' : 'enabled';
            
            setLavagnaMode(newMode === 'enabled');
            
            // Feedback visivo
            if (newMode === 'enabled') {
                showFeedback('Modalità Lavagna attivata!', 'success');
            } else {
                showFeedback('Modalità Lavagna disattivata', 'info');
            }
        });
    }
    
    // Gestione del pulsante di toggle kiosk nella pagina admin
    const kioskToggle = document.getElementById('kioskToggle');
    if (kioskToggle) {
        // Imposta lo stato iniziale del pulsante
        if (isKioskMode) {
            kioskToggle.classList.remove('btn-outline-secondary');
            kioskToggle.classList.add('btn-success');
            kioskToggle.querySelector('span').textContent = 'Attiva';
        } else {
            kioskToggle.classList.remove('btn-success');
            kioskToggle.classList.add('btn-outline-secondary');
            kioskToggle.querySelector('span').textContent = 'Disattiva';
        }
        
        // Aggiungi event listener al pulsante
        kioskToggle.addEventListener('click', function() {
            const currentMode = localStorage.getItem('kioskMode');
            const newMode = currentMode === 'enabled' ? 'disabled' : 'enabled';
            
            setKioskMode(newMode === 'enabled');
            
            // Feedback visivo
            if (newMode === 'enabled') {
                showFeedback('Modalità Kiosk attivata!', 'success');
            } else {
                showFeedback('Modalità Kiosk disattivata', 'info');
            }
        });
    }
    
    // Gestione della modalità kiosk dal menu dropdown
    const toggleKioskMenu = document.getElementById('toggleKioskMode');
    if (toggleKioskMenu) {
        // Aggiorna il testo in base allo stato
        updateKioskMenuText();
        
        // Aggiungi event listener
        toggleKioskMenu.addEventListener('click', function() {
            const currentMode = localStorage.getItem('kioskMode');
            const newMode = currentMode === 'enabled' ? 'disabled' : 'enabled';
            
            setKioskMode(newMode === 'enabled');
            
            // Aggiorna testo del menu
            updateKioskMenuText();
            
            // Chiudi il dropdown
            const dropdownMenu = toggleKioskMenu.closest('.dropdown-menu');
            if (dropdownMenu) {
                const bootstrapInstance = bootstrap.Dropdown.getInstance(dropdownMenu.previousElementSibling);
                if (bootstrapInstance) {
                    bootstrapInstance.hide();
                }
            }
            
            // Feedback visivo
            if (newMode === 'enabled') {
                showFeedback('Modalità Kiosk attivata!', 'success');
            } else {
                showFeedback('Modalità Kiosk disattivata', 'info');
            }
        });
    }
    
    // Funzione per aggiornare il testo della voce nel menu
    function updateKioskMenuText() {
        const toggleKioskMenu = document.getElementById('toggleKioskMode');
        if (!toggleKioskMenu) return;
        
        const isActive = localStorage.getItem('kioskMode') === 'enabled';
        const icon = toggleKioskMenu.querySelector('i');
        
        if (isActive) {
            if (icon) icon.className = 'fas fa-desktop me-2';
            toggleKioskMenu.innerHTML = `<i class="fas fa-desktop me-2"></i> Esci dalla Modalità Kiosk`;
        } else {
            if (icon) icon.className = 'fas fa-desktop me-2';
            toggleKioskMenu.innerHTML = `<i class="fas fa-desktop me-2"></i> Attiva Modalità Kiosk`;
        }
    }
    
    // Funzione per mostrare un feedback all'utente
    function showFeedback(message, type = 'success') {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed bottom-0 end-0 m-3`;
        feedbackDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        document.body.appendChild(feedbackDiv);
        
        // Rimuovi il feedback dopo 3 secondi
        setTimeout(() => {
            feedbackDiv.remove();
        }, 3000);
    }
    
    // Aggiungi gestore tasto ESC per uscire dalla modalità kiosk
    document.addEventListener('keydown', function(e) {
        // ESC key
        if (e.key === 'Escape' && localStorage.getItem('kioskMode') === 'enabled') {
            setKioskMode(false);
            showFeedback('Modalità Kiosk disattivata', 'info');
        }
    });
});