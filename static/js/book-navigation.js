/**
 * Modalità libro per la visualizzazione del menu a lavagna
 * 
 * Questo script implementa la navigazione a libro quando la modalità lavagna è attiva,
 * trasformando le categorie in "pagine" che si possono sfogliare come un libro.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Controllo se siamo in modalità lavagna
    const isLavagnaMode = localStorage.getItem('lavagnaMode') === 'enabled';
    
    // Funzione principale per la configurazione della navigazione a libro
    function setupBookNavigation() {
        // Verifica se la modalità lavagna è attiva
        if (document.body.classList.contains('lavagna-mode')) {
            console.log('Modalità libro attivata');
            
            // Seleziona il contenitore delle categorie
            const categoriesContainer = document.querySelector('.categories-accordion');
            if (!categoriesContainer) return;
            
            // Seleziona tutte le categorie (accordion-item)
            const categories = categoriesContainer.querySelectorAll('.accordion-item');
            if (categories.length === 0) return;
            
            // Crea i controlli di navigazione per il libro
            createBookNavigationControls(categoriesContainer, categories);
            
            // Nascondi tutte le categorie tranne la prima
            categories.forEach((category, index) => {
                if (index === 0) {
                    // Per la prima categoria, mostriamo la pagina 
                    // e apriamo l'accordion se non è già aperto
                    category.classList.add('active-page');
                    const accordionButton = category.querySelector('.accordion-button');
                    const accordionCollapse = category.querySelector('.accordion-collapse');
                    if (accordionButton && accordionButton.classList.contains('collapsed')) {
                        // Simula un click per aprire l'accordion
                        accordionButton.click();
                    }
                } else {
                    // Nascondi le altre categorie
                    category.classList.remove('active-page');
                    category.style.display = 'none';
                }
            });
        }
    }
    
    // Funzione per creare i controlli di navigazione del libro
    function createBookNavigationControls(container, pages) {
        // Rimuovi controlli esistenti se presenti
        const existingControls = document.querySelector('.book-navigation-controls');
        if (existingControls) {
            existingControls.remove();
        }
        
        // Crea il div per i controlli
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'book-navigation-controls';
        controlsDiv.innerHTML = `
            <div class="book-nav-arrows">
                <button class="btn book-prev-btn" title="Pagina precedente">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <div class="book-page-indicator">
                    <span class="current-page">1</span> / <span class="total-pages">${pages.length}</span>
                </div>
                <button class="btn book-next-btn" title="Pagina successiva">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
        
        // Inserisci i controlli prima del contenitore delle categorie
        container.parentNode.insertBefore(controlsDiv, container);
        
        // Gestisci i pulsanti di navigazione
        const prevBtn = controlsDiv.querySelector('.book-prev-btn');
        const nextBtn = controlsDiv.querySelector('.book-next-btn');
        const currentPageIndicator = controlsDiv.querySelector('.current-page');
        
        // Stato corrente
        let currentPageIndex = 0;
        
        // Event listener per il pulsante "precedente"
        prevBtn.addEventListener('click', function() {
            if (currentPageIndex > 0) {
                changePage(currentPageIndex, currentPageIndex - 1);
                currentPageIndex--;
                currentPageIndicator.textContent = currentPageIndex + 1;
                
                // Aggiorna l'indice corrente per la funzione di swipe
                if (window.updateCurrentPageIndex) {
                    window.updateCurrentPageIndex(currentPageIndex);
                }
                
                // Disabilita il pulsante "prev" se siamo alla prima pagina
                prevBtn.disabled = currentPageIndex === 0;
                nextBtn.disabled = false;
            }
        });
        
        // Event listener per il pulsante "successivo"
        nextBtn.addEventListener('click', function() {
            if (currentPageIndex < pages.length - 1) {
                changePage(currentPageIndex, currentPageIndex + 1);
                currentPageIndex++;
                currentPageIndicator.textContent = currentPageIndex + 1;
                
                // Aggiorna l'indice corrente per la funzione di swipe
                if (window.updateCurrentPageIndex) {
                    window.updateCurrentPageIndex(currentPageIndex);
                }
                
                // Disabilita il pulsante "next" se siamo all'ultima pagina
                nextBtn.disabled = currentPageIndex === pages.length - 1;
                prevBtn.disabled = false;
            }
        });
        
        // Disabilita il pulsante "prev" inizialmente poiché siamo alla prima pagina
        prevBtn.disabled = true;
        
        // Imposta lo stile per i controlli di navigazione
        const style = document.createElement('style');
        style.innerHTML = `
            .book-navigation-controls {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 1000;
                text-align: center;
                margin-top: 1rem;
            }
            
            .book-nav-arrows {
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.7);
                padding: 12px 20px;
                border-radius: 30px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
                border: 2px solid rgba(255, 255, 255, 0.3);
            }
            
            .book-prev-btn, .book-next-btn {
                color: white;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                width: 50px;
                height: 50px;
                font-size: 1.5rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 10px;
                transition: all 0.3s ease;
            }
            
            .book-prev-btn:hover, .book-next-btn:hover {
                transform: scale(1.1);
                background: rgba(255, 255, 255, 0.2);
                box-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
            }
            
            .book-prev-btn:disabled, .book-next-btn:disabled {
                color: rgba(255, 255, 255, 0.3);
                background: rgba(255, 255, 255, 0.05);
                border-color: rgba(255, 255, 255, 0.1);
                cursor: not-allowed;
                box-shadow: none;
            }
            
            .book-page-indicator {
                color: white;
                font-size: 1.2rem;
                margin: 0 20px;
                font-family: 'Chewy', cursive, 'Comic Sans MS', sans-serif;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
                min-width: 60px;
            }
            
            /* Animazioni per il cambio pagina */
            @keyframes page-turn-out-left {
                from { transform: translateX(0) rotateY(0); opacity: 1; }
                to { transform: translateX(-100%) rotateY(-30deg); opacity: 0; }
            }
            
            @keyframes page-turn-in-right {
                from { transform: translateX(100%) rotateY(30deg); opacity: 0; }
                to { transform: translateX(0) rotateY(0); opacity: 1; }
            }
            
            @keyframes page-turn-out-right {
                from { transform: translateX(0) rotateY(0); opacity: 1; }
                to { transform: translateX(100%) rotateY(30deg); opacity: 0; }
            }
            
            @keyframes page-turn-in-left {
                from { transform: translateX(-100%) rotateY(-30deg); opacity: 0; }
                to { transform: translateX(0) rotateY(0); opacity: 1; }
            }
            
            .page-out-left {
                animation: page-turn-out-left 0.5s ease-in-out forwards;
            }
            
            .page-in-right {
                animation: page-turn-in-right 0.5s ease-in-out forwards;
            }
            
            .page-out-right {
                animation: page-turn-out-right 0.5s ease-in-out forwards;
            }
            
            .page-in-left {
                animation: page-turn-in-left 0.5s ease-in-out forwards;
            }
            
            /* Stile per la pagina attiva */
            body.lavagna-mode .accordion-item.active-page {
                display: block;
                animation: none;
            }
            
            /* Disabilita comportamento normale dell'accordion in modalità libro */
            body.lavagna-mode .accordion-button::after {
                display: none;
            }
            
            body.lavagna-mode .accordion-button {
                cursor: default;
                pointer-events: none;
            }
            
            body.lavagna-mode .accordion-collapse {
                display: block !important;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // Funzione per cambiare pagina con animazione
    function changePage(fromIndex, toIndex) {
        const categories = document.querySelectorAll('.categories-accordion .accordion-item');
        
        // Determina direzione dell'animazione
        const isForward = toIndex > fromIndex;
        
        // Pagina corrente
        const currentPage = categories[fromIndex];
        // Nuova pagina
        const newPage = categories[toIndex];
        
        // Rimuovi classi di animazione precedenti
        currentPage.classList.remove('page-in-right', 'page-in-left', 'page-out-right', 'page-out-left');
        newPage.classList.remove('page-in-right', 'page-in-left', 'page-out-right', 'page-out-left');
        
        // Assicurati che la nuova pagina sia visibile ma non ancora attiva
        newPage.style.display = 'block';
        newPage.style.opacity = '0';
        
        // Anima la transizione
        if (isForward) {
            // Avanti: current esce a sinistra, new entra da destra
            currentPage.classList.add('page-out-left');
            newPage.classList.add('page-in-right');
        } else {
            // Indietro: current esce a destra, new entra da sinistra
            currentPage.classList.add('page-out-right');
            newPage.classList.add('page-in-left');
        }
        
        // Aggiorna la pagina attiva dopo l'animazione
        setTimeout(() => {
            // Nascondi la pagina precedente
            currentPage.style.display = 'none';
            currentPage.classList.remove('active-page');
            
            // Mostra la nuova pagina
            newPage.style.opacity = '1';
            newPage.classList.add('active-page');
            
            // Assicurati che il contenuto della categoria sia visibile
            const accordionButton = newPage.querySelector('.accordion-button');
            const accordionCollapse = newPage.querySelector('.accordion-collapse');
            
            if (accordionButton && accordionButton.classList.contains('collapsed')) {
                // Simula un click per aprire l'accordion
                accordionButton.click();
            }
        }, 500); // Durata dell'animazione
    }
    
    // Osserva cambiamenti nella classe del body per attivare/disattivare la modalità libro
    function observeBodyClass() {
        // Usa un MutationObserver per rilevare cambiamenti nella classe del body
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'class') {
                    const hasLavagnaClass = document.body.classList.contains('lavagna-mode');
                    
                    if (hasLavagnaClass) {
                        // Attiva la modalità libro
                        setupBookNavigation();
                        setupSwipeNavigation();
                        fixDynamicTagButtons(); // Fix per i pulsanti dei tag
                    } else {
                        // Disattiva la modalità libro e ripristina il comportamento normale
                        const categories = document.querySelectorAll('.categories-accordion .accordion-item');
                        categories.forEach(category => {
                            category.style.display = 'block';
                            category.style.opacity = '1';
                            category.classList.remove('active-page', 'page-out-left', 'page-out-right', 'page-in-left', 'page-in-right');
                        });
                        
                        // Rimuovi i controlli di navigazione
                        const controls = document.querySelector('.book-navigation-controls');
                        if (controls) {
                            controls.remove();
                        }
                    }
                }
            });
        });
        
        // Avvia l'osservazione
        observer.observe(document.body, { attributes: true });
    }
    
    // Funzione per armonizzare i bottoni dei tag generati dinamicamente
    function fixDynamicTagButtons() {
        // Cerca il container dei tag
        const tagContainer = document.getElementById('tag-buttons-container');
        if (!tagContainer) return;
        
        // Osserva i cambiamenti nel contenitore dei tag per catturare i bottoni
        // che vengono aggiunti dinamicamente dopo il caricamento della pagina
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Quando vengono aggiunti nuovi bottoni, applica gli stili specifici in base al tipo
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.classList.contains('btn')) {
                            // Estrai il nome del tag dal testo del pulsante
                            const tagName = node.textContent.trim().toLowerCase();
                            
                            // Rimuovi tutte le classi predefinite che potrebbero interferire
                            node.className = '';
                            
                            // Imposta stile base per tutti i pulsanti tag
                            node.classList.add('btn');
                            
                            // Aggiungi classe specifica per il tipo di tag
                            if (tagName.includes('vegano')) {
                                node.classList.add('btn-outline-vegano');
                            } else if (tagName.includes('vegetariano')) {
                                node.classList.add('btn-outline-vegetariano');
                            } else if (tagName.includes('piccante')) {
                                node.classList.add('btn-outline-piccante');
                            } else if (tagName.includes('gluten')) {
                                node.classList.add('btn-outline-glutenfree');
                            } else if (tagName.includes('bio')) {
                                node.classList.add('btn-outline-bio');
                            } else if (tagName.includes('artigianale')) {
                                node.classList.add('btn-outline-artigianale');
                            } else {
                                // Tag generico
                                node.classList.add('btn-tag-lavagna');
                            }
                        }
                    });
                }
            });
        });
        
        // Avvia l'osservazione
        observer.observe(tagContainer, { childList: true });
        
        // Per i pulsanti già esistenti
        const existingButtons = tagContainer.querySelectorAll('.btn');
        existingButtons.forEach(btn => {
            const tagName = btn.textContent.trim().toLowerCase();
            
            // Aggiungi classe specifica per lavagna
            if (tagName.includes('vegano')) {
                btn.classList.add('btn-outline-vegano');
            } else if (tagName.includes('vegetariano')) {
                btn.classList.add('btn-outline-vegetariano');
            } else if (tagName.includes('piccante')) {
                btn.classList.add('btn-outline-piccante');
            } else if (tagName.includes('gluten')) {
                btn.classList.add('btn-outline-glutenfree');
            } else if (tagName.includes('bio')) {
                btn.classList.add('btn-outline-bio');
            } else if (tagName.includes('artigianale')) {
                btn.classList.add('btn-outline-artigianale');
            }
        });
    }
    
    // Funzione per aggiungere il supporto al trascinamento
    function setupSwipeNavigation() {
        const container = document.querySelector('.categories-accordion');
        if (!container) return;
        
        // Variabili per il tracciamento del tocco/trascinamento
        let touchStartX = 0;
        let touchEndX = 0;
        let isDragging = false;
        let startTime = 0;
        
        // Riferimento globale all'indice della pagina corrente
        let currentPageIndex = 0;
        const categories = document.querySelectorAll('.categories-accordion .accordion-item');
        const totalPages = categories.length;
        
        // Gestione eventi touch per dispositivi mobili
        container.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
            startTime = new Date().getTime();
        }, { passive: true });
        
        container.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
        
        // Gestione eventi mouse per desktop
        container.addEventListener('mousedown', function(e) {
            touchStartX = e.clientX;
            isDragging = true;
            startTime = new Date().getTime();
            container.style.cursor = 'grabbing';
            e.preventDefault(); // Previeni la selezione del testo
        });
        
        container.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            // Aggiunge un feedback visivo durante il trascinamento
            const deltaX = e.clientX - touchStartX;
            const opacity = Math.min(Math.abs(deltaX) / 100, 0.3);
            
            if (deltaX > 0 && currentPageIndex > 0) {
                // Sta trascinando verso destra (pagina precedente)
                document.body.style.setProperty('--swipe-prev-opacity', opacity);
            } else if (deltaX < 0 && currentPageIndex < totalPages - 1) {
                // Sta trascinando verso sinistra (pagina successiva)
                document.body.style.setProperty('--swipe-next-opacity', opacity);
            }
        });
        
        container.addEventListener('mouseup', function(e) {
            if (isDragging) {
                touchEndX = e.clientX;
                isDragging = false;
                container.style.cursor = 'default';
                handleSwipe();
                // Resetta le variabili di feedback visivo
                document.body.style.setProperty('--swipe-prev-opacity', 0);
                document.body.style.setProperty('--swipe-next-opacity', 0);
            }
        });
        
        container.addEventListener('mouseleave', function(e) {
            if (isDragging) {
                touchEndX = e.clientX;
                isDragging = false;
                container.style.cursor = 'default';
                handleSwipe();
                // Resetta le variabili di feedback visivo
                document.body.style.setProperty('--swipe-prev-opacity', 0);
                document.body.style.setProperty('--swipe-next-opacity', 0);
            }
        });
        
        // Funzione per gestire lo swipe e cambiare pagina
        function handleSwipe() {
            const swipeThreshold = 100; // Soglia minima per considerare un swipe valido
            const swipeDistance = touchEndX - touchStartX;
            const elapsedTime = new Date().getTime() - startTime;
            const isQuickSwipe = elapsedTime < 300; // Se il gesto è stato rapido
            
            // Se il trascinamento è stato abbastanza ampio o è stato rapido
            if (Math.abs(swipeDistance) > swipeThreshold || (Math.abs(swipeDistance) > 50 && isQuickSwipe)) {
                if (swipeDistance > 0 && currentPageIndex > 0) {
                    // Swipe verso destra -> pagina precedente
                    const prevButton = document.querySelector('.book-prev-btn');
                    if (prevButton && !prevButton.disabled) {
                        prevButton.click();
                    }
                } else if (swipeDistance < 0 && currentPageIndex < totalPages - 1) {
                    // Swipe verso sinistra -> pagina successiva
                    const nextButton = document.querySelector('.book-next-btn');
                    if (nextButton && !nextButton.disabled) {
                        nextButton.click();
                    }
                }
            }
        }
        
        // Esporta la funzione per aggiornare l'indice corrente
        window.updateCurrentPageIndex = function(index) {
            currentPageIndex = index;
        };
        
        // Aggiungi stili per il feedback visivo durante lo swipe
        const swipeStyle = document.createElement('style');
        swipeStyle.innerHTML = `
            body.lavagna-mode::before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9999;
            }
            
            body.lavagna-mode::before {
                background: linear-gradient(
                    to right,
                    rgba(255, 255, 255, var(--swipe-prev-opacity, 0)),
                    transparent 30%,
                    transparent 70%,
                    rgba(255, 255, 255, var(--swipe-next-opacity, 0))
                );
            }
            
            .categories-accordion {
                touch-action: pan-y; /* Permette lo scroll verticale ma intercetta gli swipe orizzontali */
                user-select: none; /* Previene la selezione del testo durante il trascinamento */
            }
        `;
        document.head.appendChild(swipeStyle);
    }
    
    // Inizializza la modalità libro se la modalità lavagna è attiva
    if (isLavagnaMode) {
        // Aspetta che il DOM sia completamente caricato
        setTimeout(() => {
            setupBookNavigation();
            setupSwipeNavigation();
            fixDynamicTagButtons(); // Fix per i pulsanti dei tag generati dinamicamente
        }, 500);
    }
    
    // Inizia a osservare i cambiamenti nella classe del body
    observeBodyClass();
});