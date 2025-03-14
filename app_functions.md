# Funzionalità dell'App di Menu Digitale "Il Caffè della Piazza"

## 1. Struttura dell'Applicazione

L'applicazione è un sistema di gestione menu digitale per un locale chiamato "Il Caffè della Piazza". È realizzata con Flask, un framework Python per lo sviluppo web.

## 2. Modelli di Dati

### Utenti (User)
- Gestione degli amministratori del sistema
- Campi: id, username, password_hash, email, last_login
- Autenticazione tramite Flask-Login con hashing delle password

### Categorie (Category)
- Gestione delle categorie di prodotti con supporto per gerarchie
- Campi principali: id, name, position, is_active, icon
- Funzionalità di attivazione automatica basata su giorni e orari specifici
- Supporto per relazioni gerarchiche (categorie e sottocategorie)

### Prodotti (Product)
- Gestione completa dei prodotti del menu
- Campi: id, name, description, price, price_2, image_url, is_available, allergens, tags, position
- Supporto per doppio prezzo (es. piccolo/grande)
- Gestione di tag per filtraggio e allergeni per informazioni nutrizionali
- Possibilità di associare un prodotto a multiple categorie

### Preferenze Tema (ThemePreference)
- Personalizzazione dell'aspetto del menu digitale
- Campi: theme_name, primary_color, secondary_color, custom_css
- Controlli per mostrare/nascondere allergeni e prezzi

## 3. Funzionalità Principali

### Gestione Menu
- Visualizzazione menu pubblico organizzato per categorie e sottocategorie
- Creazione, modifica ed eliminazione di categorie e prodotti
- Riordinamento di categorie e prodotti tramite drag-and-drop
- Associazione di prodotti a multiple categorie
- Filtro prodotti per tag

### Attivazione Automatica
- Categorie possono essere programmate per attivarsi in giorni e orari specifici
- Esempio: categoria "Pranzo" attiva solo nei giorni feriali dalle 12:00 alle 15:00

### Pannello Amministrativo
- Accesso protetto da login e password
- Gestione completa di categorie e prodotti
- Impostazioni per personalizzazione del tema
- Generazione di QR code per accesso al menu

### Personalizzazione Tema
- Modifica dei colori primari e secondari
- Aggiunta di CSS personalizzato
- Opzioni per mostrare/nascondere allergeni e prezzi

### QR Code
- Generazione di QR code per accesso rapido al menu digitale
- Download come immagine per stampa

## 4. Sistema di Caching

### Backend Caching
- Implementato in cache_utils.py
- Caching in memoria e su file system (compresso con gzip)
- Decoratore @cache_response con durata configurabile
- Invalidazione cache selettiva o completa

### Frontend Caching
- Caching lato client con localStorage in JavaScript
- Durata di cache di 6 ore con refresh in background
- Ottimizzazione per sezioni di menu di grandi dimensioni

### Service Worker
- Implementazione PWA (Progressive Web App)
- Caching offline per funzionamento senza connessione
- Strategia "stale-while-revalidate" per i dati API
- Cache dedicate per API e file statici

## 5. Sicurezza

### Autenticazione
- Sistema di login basato su Flask-Login
- Password archiviate come hash nel database
- Protezione delle route amministrative con @login_required

### Protezione CSRF
- Token nei form per protezione Cross-Site Request Forgery
- SECRET_KEY per firmare i token di sessione

### Validazione Input
- Validazione e sanificazione dei dati nei form
- Controlli di tipo per valori numerici

## 6. API

### API JSON Menu
- Endpoint /api/menu per accesso ai dati del menu
- Ottimizzata con caching (durata 1 ora)
- Utilizzata dal frontend per rendering dinamico
- Struttura gerarchica con categorie e sottocategorie

## 7. Frontend

### Rendering Dinamico
- Interfaccia responsiva adatta a mobile e desktop
- Caricamento dinamico dei contenuti da API cached
- Lazy loading delle immagini per performance ottimali
- Pre-caricamento di categorie grandi in background

### Progressive Web App
- Funzionalità offline tramite service worker
- Installabile come app su dispositivi mobili
- Caching intelligente delle risorse

## 8. Database e Relazioni

### Relazioni Principali
- Categorie gerarchiche: categorie possono avere sottocategorie
- Prodotti in categorie: un prodotto può appartenere a multiple categorie
- Tabelle di relazione per gestire associazioni many-to-many

### Migrazioni
- Sistema di migrazione database con Alembic
- Evoluzione del database tracciata e versionata