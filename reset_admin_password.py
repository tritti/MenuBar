#!/usr/bin/env python
"""
Script di reset della password per l'utente admin.
Esegui questo script quando hai bisogno di reimpostare la password dell'amministratore.
Questo script è solo per uso amministrativo e non dovrebbe essere accessibile pubblicamente.
"""

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
import getpass
import sys

# Inizializza una mini app Flask per accedere al database
import os

app = Flask(__name__)
# Percorso assoluto al database
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, 'instance', 'menu.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Definisci il modello User come nell'app principale
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True)
    last_login = db.Column(db.DateTime)

def main():
    print("\n=== Reset Password Amministratore ===\n")
    
    # Ottieni la nuova password in modo sicuro
    while True:
        password = getpass.getpass("Inserisci la nuova password: ")
        if len(password) < 8:
            print("La password deve essere di almeno 8 caratteri.")
            continue
            
        confirm_password = getpass.getpass("Conferma la nuova password: ")
        if password != confirm_password:
            print("Le password non corrispondono. Riprova.")
            continue
        
        break
    
    # Esegui il reset della password
    try:
        with app.app_context():
            admin = User.query.filter_by(username='admin').first()
            
            if not admin:
                print("Utente admin non trovato nel database!")
                return 1
                
            # Genera e salva il nuovo hash della password
            admin.password_hash = generate_password_hash(password)
            db.session.commit()
            
            print("\n✅ Password dell'amministratore reimpostata con successo!")
            print("Puoi ora accedere all'applicazione con le nuove credenziali.")
            
    except Exception as e:
        print(f"\n❌ Errore durante il reset della password: {str(e)}")
        return 1
        
    return 0

if __name__ == "__main__":
    sys.exit(main())