# MenuBar

Un'applicazione web per la gestione di menu per caffè e ristoranti. Questa applicazione permette di creare, gestire e visualizzare menu digitali attraverso codici QR.

## Caratteristiche

- Gestione di categorie e prodotti
- Interfaccia amministrativa per la modifica del menu
- Generazione di codici QR per accesso ai menu
- Design responsive per visualizzazione su dispositivi mobili
- Supporto per Progressive Web App (PWA)

## Tecnologie Utilizzate

- Flask (Framework web Python)
- SQLAlchemy (ORM per database)
- Flask-Login (Gestione autenticazione)
- Flask-Migrate (Migrazione database)
- Flask-QRcode (Generazione codici QR)
- HTML, CSS, JavaScript

## Installazione

1. Clona il repository:
   ```
   git clone https://github.com/tritti/MenuBar.git
   cd MenuBar
   ```

2. Crea un ambiente virtuale e installare le dipendenze:
   ```
   python -m venv venv
   source venv/bin/activate  # Su Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Avvia l'applicazione:
   ```
   flask run
   ```

## Licenza

Questo progetto è di proprietà di Tritti.