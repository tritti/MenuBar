document.addEventListener('DOMContentLoaded', function() {
    // Initialize all tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });

    // Price input validation
    document.querySelectorAll('input[type="number"][step="0.01"]').forEach(function(input) {
        input.addEventListener('change', function() {
            let value = parseFloat(this.value);
            if (value < 0) {
                this.value = 0;
            }
            this.value = value.toFixed(2);
        });
    });
    
    // Banner per l'installazione PWA
    let deferredPrompt;
    const installBanner = document.createElement('div');
    installBanner.className = 'install-banner';
    installBanner.style.display = 'none';
    installBanner.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <span>Installa l'app per usarla offline</span>
            <div>
                <button class="btn btn-sm btn-primary install-btn me-2">Installa</button>
                <button class="btn btn-sm btn-light dismiss-btn">No grazie</button>
            </div>
        </div>
    `;
    document.body.appendChild(installBanner);
    
    window.addEventListener('beforeinstallprompt', (e) => {
        // Impedisci al browser di mostrare il prompt automatico
        e.preventDefault();
        // Salva l'evento per usarlo dopo
        deferredPrompt = e;
        // Mostra il banner di installazione
        installBanner.style.display = 'block';
        installBanner.style.position = 'fixed';
        installBanner.style.bottom = '0';
        installBanner.style.left = '0';
        installBanner.style.right = '0';
        installBanner.style.background = 'white';
        installBanner.style.padding = '10px 15px';
        installBanner.style.boxShadow = '0 -2px 10px rgba(0,0,0,0.1)';
        installBanner.style.zIndex = '1000';
        
        // Gestione del pulsante di installazione
        document.querySelector('.install-btn').addEventListener('click', async () => {
            // Nascondi il banner
            installBanner.style.display = 'none';
            // Mostra il prompt di installazione
            deferredPrompt.prompt();
            // Attendi che l'utente risponda al prompt
            const choiceResult = await deferredPrompt.userChoice;
            // Resetta la variabile deferredPrompt
            deferredPrompt = null;
        });
        
        // Gestione del pulsante di rifiuto
        document.querySelector('.dismiss-btn').addEventListener('click', () => {
            installBanner.style.display = 'none';
            // Salva preferenza
            localStorage.setItem('pwaInstallDismissed', 'true');
        });
        
        // Non mostrare se l'utente ha già rifiutato
        if (localStorage.getItem('pwaInstallDismissed') === 'true') {
            installBanner.style.display = 'none';
        }
    });
    
    // Touch ottimizzazioni
    // Previeni zoom su doppio tap (per smartphone)
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Animazione per le card all'apertura della pagina
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, 100 * index);
    });

    // Gestione lazy loading immagini
    if ('loading' in HTMLImageElement.prototype) {
        // Il browser supporta lazy loading nativo
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.dataset.src;
        });
    } else {
        // Fallback per browser che non supportano lazy loading nativo
        const lazyImages = document.querySelectorAll('img[data-src]');
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const image = entry.target;
                        image.src = image.dataset.src;
                        imageObserver.unobserve(image);
                    }
                });
            });

            lazyImages.forEach(image => {
                imageObserver.observe(image);
            });
        } else {
            // Fallback semplice
            lazyImages.forEach(image => {
                image.src = image.dataset.src;
            });
        }
    }

    // Animazione accordion (per categorie principali e sottocategorie)
    function setupAccordionAnimations() {
        // Per le categorie principali
        const accordionButtons = document.querySelectorAll('.accordion-button');
        accordionButtons.forEach(button => {
            button.addEventListener('click', function() {
                const isCollapsed = this.classList.contains('collapsed');
                
                if (!isCollapsed) {
                    // Si sta aprendo l'accordion
                    const accordionBody = this.closest('.accordion-item').querySelector('.accordion-body');
                    accordionBody.style.opacity = '0';
                    accordionBody.style.transform = 'translateY(-10px)';
                    
                    setTimeout(() => {
                        accordionBody.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                        accordionBody.style.opacity = '1';
                        accordionBody.style.transform = 'translateY(0)';
                    }, 50);
                }
            });
        });
        
        // Per le sottocategorie
        const subcategoryButtons = document.querySelectorAll('.subcategory-button');
        subcategoryButtons.forEach(button => {
            button.addEventListener('click', function() {
                const isCollapsed = this.classList.contains('collapsed');
                
                if (!isCollapsed) {
                    // Si sta aprendo la sottocategoria
                    const target = this.getAttribute('data-bs-target');
                    const subcategoryContent = document.querySelector(target);
                    
                    subcategoryContent.addEventListener('shown.bs.collapse', function() {
                        // Animazione quando il contenuto è completamente visibile
                        const section = this.querySelector('.subcategory-section');
                        section.style.opacity = '0';
                        section.style.transform = 'translateY(10px)';
                        
                        setTimeout(() => {
                            section.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                            section.style.opacity = '1';
                            section.style.transform = 'translateY(0)';
                        }, 10);
                    }, {once: true}); // esegue una sola volta per apertura
                }
            });
        });
    }
    
    // Inizializza le animazioni
    setupAccordionAnimations();
    
    // Toggle dark mode
    function initDarkMode() {
        console.log("Initializing dark mode...");
        const darkModeToggle = document.getElementById('darkModeToggle');
        
        if (!darkModeToggle) {
            console.log("Dark mode toggle button not found");
            return;
        }
        
        console.log("Dark mode toggle button found");
        
        // Funzione per aggiornare l'interfaccia in base alla modalità
        function updateDarkModeUI(isDark) {
            if (isDark) {
                document.body.classList.add('dark-mode');
                document.body.classList.remove('light-mode');
                darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
                darkModeToggle.setAttribute('title', 'Passa alla modalità chiara');
                darkModeToggle.classList.remove('btn-outline-light');
                darkModeToggle.classList.add('btn-warning');
                console.log("Dark mode enabled");
                
                // Forza la navbar ad essere in dark mode
                const navbar = document.querySelector('.navbar');
                navbar.classList.remove('bg-light');
                navbar.classList.add('bg-dark');
                navbar.classList.add('navbar-dark');
                
            } else {
                document.body.classList.remove('dark-mode');
                document.body.classList.add('light-mode');
                darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
                darkModeToggle.setAttribute('title', 'Passa alla modalità scura');
                darkModeToggle.classList.remove('btn-warning');
                darkModeToggle.classList.add('btn-outline-light');
                console.log("Dark mode disabled");
            }
        }
        
        // Evento al click del pulsante
        darkModeToggle.addEventListener('click', function() {
            console.log("Dark mode toggle clicked");
            const isDarkMode = !document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
            updateDarkModeUI(isDarkMode);
        });
        
        // Controlla le preferenze salvate dall'utente
        const savedDarkMode = localStorage.getItem('darkMode');
        console.log("Saved dark mode preference:", savedDarkMode);
        
        if (savedDarkMode === 'enabled') {
            updateDarkModeUI(true);
        } else if (savedDarkMode === 'disabled') {
            updateDarkModeUI(false);
        } else {
            // Se non ci sono preferenze, usa le preferenze di sistema
            const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
            console.log("System prefers dark mode:", prefersDarkScheme);
            updateDarkModeUI(prefersDarkScheme);
        }
        
        // Aggiungi un listener per i cambiamenti nelle preferenze di sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (localStorage.getItem('darkMode') === null) {
                updateDarkModeUI(e.matches);
            }
        });
    }
    
    // Inizializza dark mode
    initDarkMode();
});
