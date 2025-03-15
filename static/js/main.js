document.addEventListener('DOMContentLoaded', function() {
    // Initialize all tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });
    
    // Gestione finestra modale per dettagli prodotto
    const productModal = document.getElementById('productModal');
    if (productModal) {
        productModal.addEventListener('show.bs.modal', function(event) {
            // Elemento che ha attivato la modale
            const button = event.relatedTarget;
            
            // Estrai le informazioni del prodotto dai data attributes
            const productName = button.getAttribute('data-product-name');
            const productDescription = button.getAttribute('data-product-description') || '';
            const productPrice = button.getAttribute('data-product-price');
            const productPrice2 = button.getAttribute('data-product-price2');
            const productPrice2Label = button.getAttribute('data-product-price2-label');
            const productAllergens = button.getAttribute('data-product-allergens');
            const productImage = button.getAttribute('data-product-image');
            const productTags = button.getAttribute('data-product-tags');
            
            // Aggiorna i contenuti della modale
            const modalTitle = productModal.querySelector('.modal-title');
            const modalDescription = productModal.querySelector('#modalProductDescription');
            const modalPrice = productModal.querySelector('#modalProductPrice');
            const modalAllergens = productModal.querySelector('#modalProductAllergens');
            const modalImage = productModal.querySelector('#modalProductImage');
            const modalTags = productModal.querySelector('#modalProductTags');
            
            // Imposta il titolo
            modalTitle.textContent = productName;
            
            // Imposta la descrizione
            modalDescription.textContent = productDescription;
            
            // Imposta il prezzo
            if (productPrice) {
                let priceHtml = `<p class="price mb-0">€ ${parseFloat(productPrice).toFixed(2)}</p>`;
                
                if (productPrice2 && parseFloat(productPrice2) > 0) {
                    let price2Text = '';
                    if (productPrice2Label) {
                        price2Text = `${productPrice2Label}: `;
                    }
                    priceHtml += `<p class="price-2">${price2Text}€ ${parseFloat(productPrice2).toFixed(2)}</p>`;
                }
                
                modalPrice.innerHTML = priceHtml;
                modalPrice.style.display = 'block';
            } else {
                modalPrice.style.display = 'none';
            }
            
            // Imposta allergeni
            if (productAllergens) {
                modalAllergens.innerHTML = `<small class="text-muted">Allergeni: ${productAllergens}</small>`;
                modalAllergens.style.display = 'block';
            } else {
                modalAllergens.style.display = 'none';
            }
            
            // Imposta immagine
            if (productImage) {
                modalImage.innerHTML = `<img src="${productImage}" alt="${productName}" class="img-fluid">`;
                modalImage.style.display = 'block';
            } else {
                modalImage.style.display = 'none';
            }
            
            // Imposta tag
            if (productTags) {
                const tagsArray = productTags.split(',');
                let tagsHtml = '';
                
                tagsArray.forEach(tag => {
                    const trimmedTag = tag.trim();
                    if (trimmedTag) {
                        const tagClass = `badge-${trimmedTag.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
                        tagsHtml += `<a href="/tag/${encodeURIComponent(trimmedTag)}" class="badge bg-light text-dark me-1 mb-1 ${tagClass}">${trimmedTag}</a>`;
                    }
                });
                
                modalTags.innerHTML = tagsHtml;
                modalTags.style.display = 'block';
            } else {
                modalTags.style.display = 'none';
            }
        });
    }

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
        // Disabilita temporaneamente le animazioni
        // NOTA: Questo codice è stato temporaneamente disabilitato per migliorare le prestazioni
        // Ripristinare in futuro se necessario
        /*
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, 100 * index);
        */
        
        // Mostra direttamente gli elementi senza animazione
        item.style.opacity = '1';
    });

    // Gestione lazy loading immagini ottimizzata
    function setupLazyLoading() {
        // Carica immediatamente solo le immagini visibili nella viewort iniziale
        // e prepara il caricamento lazy per le altre quando diventano visibili 
        const loadVisibleImages = () => {
            // Inizializza solo le immagini visibili nella viewport iniziale
            const lazyImages = document.querySelectorAll('img[data-src]');
            
            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const image = entry.target;
                            if (image.dataset.src && !image.src) {
                                // Caricamento diretto senza effetti
                                image.src = image.dataset.src;
                                // Rimuovi data-src dopo il caricamento per evitare caricamenti duplicati
                                image.removeAttribute('data-src');
                                imageObserver.unobserve(image);
                            }
                        }
                    });
                }, {
                    rootMargin: '300px 0px', // Aumentato da 200px a 300px per precaricare più in anticipo
                    threshold: 0.01
                });
                
                // Osserva tutte le immagini con data-src
                lazyImages.forEach(image => {
                    // Assicurati che l'immagine non sia già stata caricata
                    if (image.dataset.src && !image.src) {
                        imageObserver.observe(image);
                    }
                });
            } else {
                // Fallback per browser più vecchi che non supportano IntersectionObserver
                // Carica solo le immagini nelle categorie espanse
                const expandedCategories = document.querySelectorAll('.accordion-collapse.show');
                expandedCategories.forEach(category => {
                    const categoryImages = category.querySelectorAll('img[data-src]');
                    categoryImages.forEach(image => {
                        if (image.dataset.src && !image.src) {
                            image.src = image.dataset.src;
                            image.removeAttribute('data-src');
                        }
                    });
                });
            }
        };
    
        // Carica le immagini visibili all'inizio
        loadVisibleImages();
        
        // Ricarica quando l'utente interagisce con il menu (espande categorie)
        const categoriesAccordion = document.querySelector('.categories-accordion');
        if (categoriesAccordion) {
            categoriesAccordion.addEventListener('shown.bs.collapse', loadVisibleImages);
        }
        
        // Imposta un timer per controllare nuovamente dopo lo scroll
        let scrollTimer;
        window.addEventListener('scroll', () => {
            if (scrollTimer) clearTimeout(scrollTimer);
            scrollTimer = setTimeout(loadVisibleImages, 300); // Aumentato da 200ms a 300ms
        }, { passive: true });
    }
    
    // Inizializza lazy loading
    setupLazyLoading();
    
    // Funzione per gestire l'espansione delle descrizioni
    function setupDescriptionToggles() {
        // Seleziona tutte le descrizioni disponibili
        const descriptions = document.querySelectorAll('.card-text');
        
        descriptions.forEach(description => {
            // Se c'è testo nella descrizione
            if (description.textContent.trim()) {
                // Verifica se un pulsante già esiste per questa descrizione
                let existingToggle = description.nextElementSibling;
                if (existingToggle && existingToggle.classList.contains('description-toggle')) {
                    // Pulsante già esistente, salta questa descrizione
                    return;
                }
                
                // Controlla se la descrizione è più alta del contenitore (overflow)
                if (description.scrollHeight > description.clientHeight) {
                    // Crea pulsante per espandere/comprimere
                    const toggleButton = document.createElement('span');
                    toggleButton.className = 'description-toggle';
                    toggleButton.textContent = 'Leggi di più';
                    toggleButton.setAttribute('aria-expanded', 'false');
                    
                    // Aggiungi pulsante dopo la descrizione
                    description.parentNode.insertBefore(toggleButton, description.nextSibling);
                    
                    // Aggiungi evento per espandere/comprimere
                    toggleButton.addEventListener('click', function() {
                        const expanded = this.getAttribute('aria-expanded') === 'true';
                        
                        if (expanded) {
                            // Comprimi descrizione
                            description.classList.remove('expanded');
                            this.textContent = 'Leggi di più';
                            this.setAttribute('aria-expanded', 'false');
                        } else {
                            // Espandi descrizione
                            description.classList.add('expanded');
                            this.textContent = 'Mostra meno';
                            this.setAttribute('aria-expanded', 'true');
                        }
                    });
                }
            }
        });
    }
    
    // Avvia il setup delle descrizioni espandibili quando si apre una categoria
    document.querySelectorAll('.accordion-collapse').forEach(collapse => {
        collapse.addEventListener('shown.bs.collapse', function() {
            // Timeout per permettere al contenuto di essere completamente renderizzato
            setTimeout(() => {
                setupDescriptionToggles();
            }, 100);
        });
    });
    
    // Setup per i prodotti in evidenza già visibili all'apertura
    setTimeout(() => {
        // Setup iniziale per tutti i prodotti visibili con un piccolo ritardo
        // per assicurarsi che tutto sia renderizzato
        setupDescriptionToggles();
    }, 500);

    // Animazione accordion (per categorie principali e sottocategorie) - versione ottimizzata
    function setupAccordionAnimations() {
        // Memorizza le categorie già caricate per evitare ricaricamenti
        const loadedCategories = new Set();
        
        // Verifica se la categoria è una di quelle pesanti che richiedono ottimizzazione
        function isLargeCategory(categoryName) {
            if (!categoryName) return false;
            const lowerName = categoryName.toLowerCase();
            return lowerName.includes('pranzo') || lowerName.includes('cena');
        }
        
        // Pre-carica le sezioni pesanti (pranzo, cena) appena dopo il caricamento iniziale della pagina
        function preloadLargeSections() {
            if (typeof MenuCache !== 'undefined' && MenuCache.PRECACHE_SECTIONS) {
                // Trova i pulsanti delle categorie principali corrispondenti a sezioni da pre-caricare
                const accordionButtons = document.querySelectorAll('.accordion-button');
                const buttonsToPreload = [];
                
                // Identifica i pulsanti delle sezioni da precaricare
                accordionButtons.forEach(button => {
                    const categoryName = button.textContent.trim();
                    const categoryId = button.getAttribute('data-bs-target');
                    
                    if (MenuCache.PRECACHE_SECTIONS.some(section => 
                        categoryName.toLowerCase().includes(section.toLowerCase()))) {
                        buttonsToPreload.push({button, categoryName, categoryId});
                    }
                });
                
                // Precarica in background con un ritardo
                if (buttonsToPreload.length > 0) {
                    console.log(`Pre-caricamento di ${buttonsToPreload.length} sezioni grandi...`);
                    setTimeout(() => {
                        buttonsToPreload.forEach(({categoryId}, index) => {
                            if (categoryId) {
                                const content = document.querySelector(categoryId);
                                if (content) {
                                    // Prepara i contenuti ma lascia il pannello chiuso
                                    preloadCategoryContent(content, false);
                                }
                            }
                        });
                    }, 1000); // Ritardo di 1 secondo dopo il caricamento iniziale
                }
            }
        }
        
        // Precarica il contenuto di una categoria
        function preloadCategoryContent(container, showAnimation = true) {
            if (!container) return;
            
            // Evita di ricaricare se già caricato
            const categoryId = container.id;
            if (loadedCategories.has(categoryId)) return;
            
            // Carica le immagini lazy
            const lazyImages = container.querySelectorAll('img[data-src]');
            if (lazyImages.length > 0) {
                lazyImages.forEach(img => {
                    if (img.dataset.src && !img.src) {
                        // Assegna direttamente l'immagine senza animazione
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                });
            }
            
            // Segna come caricato
            loadedCategories.add(categoryId);
            
            // Disabilita temporaneamente le animazioni
            // NOTA: Questo codice è stato temporaneamente disabilitato per migliorare le prestazioni
            // Ripristinare in futuro se necessario
            /*
            if (showAnimation) {
                const accordionBody = container.querySelector('.accordion-body');
                if (accordionBody) {
                    accordionBody.style.opacity = '0';
                    accordionBody.style.transform = 'translateY(-10px)';
                    
                    setTimeout(() => {
                        accordionBody.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                        accordionBody.style.opacity = '1';
                        accordionBody.style.transform = 'translateY(0)';
                    }, 10); // Riduci il ritardo a 10ms invece di 50ms
                }
            }
            */
        }
        
        // Per le categorie principali
        const accordionButtons = document.querySelectorAll('.accordion-button');
        accordionButtons.forEach(button => {
            button.addEventListener('click', function() {
                const isCollapsed = this.classList.contains('collapsed');
                
                if (!isCollapsed) {
                    // Si sta aprendo l'accordion
                    const categoryName = this.textContent.trim();
                    const accordionItem = this.closest('.accordion-item');
                    const contentContainer = accordionItem.querySelector('.accordion-collapse');
                    
                    // Usa un'animazione semplificata per sezioni grandi
                    if (isLargeCategory(categoryName)) {
                        console.log(`Ottimizzazione apertura sezione grande: ${categoryName}`);
                        preloadCategoryContent(contentContainer, true);
                    } else {
                        // Approccio normale per categorie più piccole
                        preloadCategoryContent(contentContainer, true);
                    }
                }
            });
        });
        
        // Per le sottocategorie - approccio ottimizzato con delegazione degli eventi
        const categoriesContainer = document.querySelector('.categories-accordion');
        if (categoriesContainer) {
            // Unico event listener per tutti i pulsanti delle sottocategorie
            categoriesContainer.addEventListener('click', function(event) {
                // Verifica se il click è su un pulsante di sottocategoria
                const button = event.target.closest('.subcategory-button');
                if (!button) return;
                
                const isCollapsed = button.classList.contains('collapsed');
                if (!isCollapsed) {
                    // Si sta aprendo la sottocategoria
                    const targetId = button.getAttribute('data-bs-target');
                    if (!targetId) return;
                    
                    const subcategoryContent = document.querySelector(targetId);
                    if (!subcategoryContent) return;
                    
                    // Prenota l'animazione per quando il contenuto è mostrato
                    subcategoryContent.addEventListener('shown.bs.collapse', function handleShown() {
                        const section = this.querySelector('.subcategory-section');
                        if (section) {
                            // Carica le immagini
                            const lazyImages = section.querySelectorAll('img[data-src]');
                            lazyImages.forEach(img => {
                                if (img.dataset.src && !img.src) {
                                    img.src = img.dataset.src;
                                    img.removeAttribute('data-src');
                                }
                            });
                            
                            // Disabilita temporaneamente le animazioni
                            // NOTA: Questo codice è stato temporaneamente disabilitato per migliorare le prestazioni
                            // Ripristinare in futuro se necessario
                            /*
                            section.style.opacity = '0';
                            requestAnimationFrame(() => {
                                section.style.transition = 'opacity 0.2s ease';
                                section.style.opacity = '1';
                            });
                            */
                        }
                        
                        // Rimuovi l'event listener dopo l'esecuzione
                        this.removeEventListener('shown.bs.collapse', handleShown);
                    });
                }
            });
        }
        
        // Avvia il precaricamento delle sezioni grandi
        setTimeout(preloadLargeSections, 500);
    }
    
    // Inizializza le animazioni
    setupAccordionAnimations();
    
    // Toggle dark mode
    function initDarkMode() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (!darkModeToggle) return;
        
        // Funzione per prevenire il flash
        function preventDarkModeFlash() {
            const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
            // Se dark mode è attiva, aggiungi subito la classe
            if (isDarkMode) {
                document.documentElement.classList.add('dark-transitioning');
                document.body.classList.add('dark-mode');
            }
        }
        
        // Preveni il flash all'inizio
        preventDarkModeFlash();
        
        // Funzione per aggiornare l'interfaccia in base alla modalità
        function updateDarkModeUI(isDark) {
            if (isDark) {
                document.body.classList.add('dark-mode');
                document.body.classList.remove('light-mode');
                darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
                darkModeToggle.setAttribute('title', 'Passa alla modalità chiara');
                darkModeToggle.classList.remove('btn-outline-light');
                darkModeToggle.classList.add('btn-warning');
                
                // Forza la navbar ad essere in dark mode
                const navbar = document.querySelector('.navbar');
                if (navbar) {
                    navbar.classList.remove('bg-light');
                    navbar.classList.add('bg-dark');
                    navbar.classList.add('navbar-dark');
                }
            } else {
                document.body.classList.remove('dark-mode');
                document.body.classList.add('light-mode');
                darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
                darkModeToggle.setAttribute('title', 'Passa alla modalità scura');
                darkModeToggle.classList.remove('btn-warning');
                darkModeToggle.classList.add('btn-outline-light');
            }
        }
        
        // Evento al click del pulsante
        darkModeToggle.addEventListener('click', function() {
            const isDarkMode = !document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
            updateDarkModeUI(isDarkMode);
            
            // Se si passa alla dark mode, previeni il flash per le navigazioni successive
            if (isDarkMode) {
                document.documentElement.classList.add('dark-transitioning');
            } else {
                document.documentElement.classList.remove('dark-transitioning');
            }
        });
        
        // Controlla le preferenze salvate dall'utente
        const savedDarkMode = localStorage.getItem('darkMode');
        
        if (savedDarkMode === 'enabled') {
            updateDarkModeUI(true);
        } else if (savedDarkMode === 'disabled') {
            updateDarkModeUI(false);
        } else {
            // Se non ci sono preferenze, usa le preferenze di sistema
            const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
            updateDarkModeUI(prefersDarkScheme);
            // Salva la preferenza
            localStorage.setItem('darkMode', prefersDarkScheme ? 'enabled' : 'disabled');
        }
        
        // Aggiungi un listener per i cambiamenti nelle preferenze di sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (localStorage.getItem('darkMode') === null) {
                updateDarkModeUI(e.matches);
                // Salva la preferenza
                localStorage.setItem('darkMode', e.matches ? 'enabled' : 'disabled');
            }
        });
    }
    
    // Inizializza dark mode
    initDarkMode();
    
    // Product search functionality
    const searchInput = document.getElementById('productSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('#productsSortable tr');
            
            rows.forEach(row => {
                const name = row.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
                const category = row.querySelector('td:nth-child(3)')?.textContent.toLowerCase() || '';
                const price = row.querySelector('td:nth-child(4)')?.textContent.toLowerCase() || '';
                
                if (name.includes(searchTerm) || category.includes(searchTerm) || price.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
});
