#!/usr/bin/env python3
"""
Script per invalidare manualmente la cache del menu.
Utile quando si aggiungono nuovi prodotti o tag e le modifiche 
non compaiono immediatamente a causa della cache.
"""

import os
import sys

# Controlla se siamo nella directory corretta
if not os.path.exists('cache_utils.py'):
    print("Errore: Esegui questo script dalla directory principale dell'applicazione!")
    sys.exit(1)

try:
    from cache_utils import invalidate_all_caches, invalidate_cache
    
    # Invalida direttamente la cache del menu, più sicuro in modalità non interattiva
    print("Invalidazione della cache del menu...")
    if invalidate_cache('menu_data'):
        print("✓ La cache del menu è stata invalidata con successo!")
    else:
        print("✗ Si è verificato un errore durante l'invalidazione della cache del menu.")
    
    # Verifica se esiste la directory cache e il file menu_data.gz
    if os.path.exists('cache') and os.path.exists('cache/menu_data.gz'):
        print("Il file cache/menu_data.gz esiste ancora - potrebbe esserci un problema con l'invalidazione")
    else:
        print("Verifica file cache completata con successo")
    
    # Istruzioni aggiuntive per l'utente
    print("\nNota: Potrebbe essere necessario anche cancellare la cache del browser.")
    print("Per farlo, apri la console del browser (F12) ed esegui: MenuCache.clearCache()")
    
except ImportError:
    print("Errore: Impossibile importare le funzioni di cache. Controlla che il file cache_utils.py esista.")
    sys.exit(1)
except Exception as e:
    print(f"Errore imprevisto: {str(e)}")
    sys.exit(1)