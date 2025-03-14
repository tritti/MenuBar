from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_migrate import Migrate
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime
from flask_qrcode import QRcode
import secrets
from sqlalchemy_utils import URLType

app = Flask(__name__)
# Usa una chiave fissa per la produzione o caricala da una variabile d'ambiente
# In questo modo la chiave non cambia a ogni riavvio del server
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'ilcaffedellapiazzapanicalekey'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///menu.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
migrate = Migrate(app, db)
qrcode = QRcode(app)  # Aggiungiamo il supporto per codici QR

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Accedi per gestire il menu'

# Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True)
    last_login = db.Column(db.DateTime)

# Association table for category relationships
category_relationships = db.Table('category_relationships',
    db.Column('parent_category_id', db.Integer, db.ForeignKey('category.id'), primary_key=True),
    db.Column('child_category_id', db.Integer, db.ForeignKey('category.id'), primary_key=True)
)

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    products = db.relationship('Product', backref='category', lazy=True)
    position = db.Column(db.Integer, default=0)  # Per ordinare le categorie
    is_active = db.Column(db.Boolean, default=True)  # Per nascondere temporaneamente categorie
    icon = db.Column(db.String(100))  # URL icona per la categoria
    
    # Relazione many-to-many per le categorie padre
    parents = db.relationship('Category',
                            secondary=category_relationships,
                            primaryjoin=(id == category_relationships.c.child_category_id),
                            secondaryjoin=(id == category_relationships.c.parent_category_id),
                            backref=db.backref('children', lazy='dynamic'),
                            lazy='dynamic')
    
    # Campi per l'attivazione automatica
    auto_activate = db.Column(db.Boolean, default=False)  # Attiva/disattiva automazione
    active_days = db.Column(db.String(100), default="0,1,2,3,4,5,6")  # Giorni attivi (0=lunedi, 6=domenica)
    active_start_time = db.Column(db.String(5), default="00:00")  # Orario inizio (formato HH:MM)
    active_end_time = db.Column(db.String(5), default="23:59")  # Orario fine (formato HH:MM)

    def get_subcategories(self):
        return self.children.filter_by(is_active=True).order_by(Category.position).all()

    def is_subcategory(self):
        return self.parents.count() > 0
        
    def active_products(self):
        return [p for p in self.all_products.filter_by(is_available=True).all()]
        
    def should_be_active(self):
        """Verifica se la categoria dovrebbe essere attiva in base ai criteri di automazione"""
        if not self.auto_activate:
            return self.is_active
            
        # Converti giorni attivi da stringa a lista di interi
        active_days_list = [int(day) for day in self.active_days.split(',') if day.strip()]
        
        # Ottieni data e ora correnti
        now = datetime.now()
        current_weekday = now.weekday()  # 0=lunedi, 6=domenica
        current_time = now.strftime("%H:%M")
        
        # Verifica se il giorno corrente è tra i giorni attivi
        if current_weekday not in active_days_list:
            return False
            
        # Verifica se l'ora corrente è nell'intervallo attivo
        return self.active_start_time <= current_time <= self.active_end_time

# Association table for product-category many-to-many relationship
product_categories = db.Table('product_categories',
    db.Column('product_id', db.Integer, db.ForeignKey('product.id', ondelete='CASCADE'), primary_key=True),
    db.Column('category_id', db.Integer, db.ForeignKey('category.id', ondelete='CASCADE'), primary_key=True)
)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    price_2 = db.Column(db.Float)  # Secondo prezzo opzionale
    price_2_label = db.Column(db.String(20))  # Etichetta per il secondo prezzo
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'))  # Primary category
    categories = db.relationship('Category', secondary=product_categories, 
                               backref=db.backref('all_products', lazy='dynamic'))
    image_url = db.Column(db.String(200))
    is_available = db.Column(db.Boolean, default=True)  # Per gestire disponibilità
    is_featured = db.Column(db.Boolean, default=False)  # Per prodotti in evidenza
    allergens = db.Column(db.String(200))  # Elenco allergeni
    tags = db.Column(db.String(200))  # Tag per filtraggio (es. "vegano", "piccante")
    position = db.Column(db.Integer, default=0)  # Per ordinare i prodotti
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Routes
@app.template_filter('now')
def now_filter(format_string):
    return datetime.now().strftime(format_string)

# Modello per preferenze tema
class ThemePreference(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    theme_name = db.Column(db.String(50), default='default')
    primary_color = db.Column(db.String(20), default='#8B0000')
    secondary_color = db.Column(db.String(20), default='#2c3e50')
    show_allergens = db.Column(db.Boolean, default=True)
    show_prices = db.Column(db.Boolean, default=True)
    custom_css = db.Column(db.Text)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

@app.route('/')
def index():
    # Aggiorna lo stato delle categorie automatiche
    update_auto_activate_categories()
    
    # Get main categories for the template - solo categorie attive, ordinate per posizione
    main_categories = Category.query.filter(
        ~Category.parents.any(),
        Category.is_active == True
    ).order_by(Category.position).all()
    
    # Ottieni prodotti in evidenza
    featured_products = Product.query.filter_by(is_featured=True, is_available=True).order_by(Product.position).all()
    
    # Ottieni preferenze tema
    theme = ThemePreference.query.first()
    if not theme:
        theme = ThemePreference()
        db.session.add(theme)
        db.session.commit()
    
    return render_template('index.html', 
                          categories=main_categories,
                          featured_products=featured_products,
                          theme=theme)
                          
def update_auto_activate_categories():
    """Aggiorna lo stato delle categorie con attivazione automatica"""
    try:
        # Trova tutte le categorie con attivazione automatica
        auto_categories = Category.query.filter_by(auto_activate=True).all()
        
        for category in auto_categories:
            # Determina se la categoria dovrebbe essere attiva in base a giorni e orari
            should_be_active = category.should_be_active()
            
            # Aggiorna solo se c'è un cambiamento
            if category.is_active != should_be_active:
                category.is_active = should_be_active
                db.session.add(category)
        
        db.session.commit()
    except Exception as e:
        # Registra l'errore ma non interrompere il caricamento della pagina
        print(f"Errore nell'aggiornamento delle categorie automatiche: {str(e)}")
        db.session.rollback()

@app.route('/admin')
@login_required
def admin():
    print("\n=== ADMIN DEBUG ===")
    print("User authenticated:", current_user.is_authenticated)
    print("User:", current_user)
    
    # Aggiorna lo stato delle categorie automatiche
    update_auto_activate_categories()
    
    products = Product.query.order_by(Product.category_id, Product.position).all()
    main_categories = Category.query.filter(~Category.parents.any()).order_by(Category.position).all()
    all_categories = Category.query.order_by(Category.position).all()
    
    # Get theme preferences
    theme = ThemePreference.query.first()
    if not theme:
        theme = ThemePreference()
        db.session.add(theme)
        db.session.commit()
    
    # Conta prodotti non disponibili
    unavailable_count = Product.query.filter_by(is_available=False).count()
    # Conta categorie non attive
    inactive_categories = Category.query.filter_by(is_active=False).count()
    # Conta categorie con attivazione automatica
    auto_categories = Category.query.filter_by(auto_activate=True).count()
    
    print("Rendering admin template")
    
    return render_template('admin.html', 
                          products=products, 
                          main_categories=main_categories, 
                          all_categories=all_categories,
                          theme=theme,  # Make sure theme is passed to template
                          stats={
                              'product_count': len(products),
                              'category_count': len(all_categories),
                              'unavailable_count': unavailable_count,
                              'inactive_categories': inactive_categories,
                              'auto_categories': auto_categories
                          })

@app.route('/login', methods=['GET', 'POST'])
def login():
    print("\n=== LOGIN DEBUG ===")
    print("Is authenticated:", current_user.is_authenticated)
    
    if current_user.is_authenticated:
        print("User already authenticated, redirecting to admin")
        return redirect(url_for('admin'))
        
    if request.method == 'POST':
        print("Processing POST request")
        print("Form data:", request.form)
        
        user = User.query.filter_by(username=request.form['username']).first()
        print("User found:", user is not None)
        
        if user and check_password_hash(user.password_hash, request.form['password']):
            print("Password correct, logging in user")
            login_result = login_user(user, remember=True)
            print("Login result:", login_result)
            
            # Aggiorna data ultimo accesso
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            next_page = request.args.get('next')
            print("Next page:", next_page)
            print("Redirecting to:", next_page or url_for('admin'))
            print("Is user authenticated after login:", current_user.is_authenticated)
            
            return redirect(next_page or url_for('admin'))
            
        print("Invalid credentials")
        flash('Username o password non validi', 'danger')
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

# Category management routes
@app.route('/category/add', methods=['POST'])
@login_required
def add_category():
    print("\n=== ADD CATEGORY DEBUG ===")
    print("Form data:", request.form)
    
    name = request.form['name']
    parent_ids = request.form.getlist('parent_id')
    
    print(f"Name: {name}")
    print(f"Parent IDs: {parent_ids}")
    
    try:
        new_category = Category(name=name)
        db.session.add(new_category)
        
        # Add parent relationships
        for parent_id in parent_ids:
            if parent_id and parent_id != '':
                parent = Category.query.get(int(parent_id))
                if parent:
                    new_category.parents.append(parent)
        
        db.session.commit()
        print(f"Category created successfully with ID: {new_category.id}")
        flash('Categoria creata con successo!', 'success')
    except Exception as e:
        print(f"Error creating category: {str(e)}")
        db.session.rollback()
        flash('Errore nella creazione della categoria', 'error')
    
    print("=== END ADD CATEGORY DEBUG ===\n")
    return redirect(url_for('admin'))

@app.route('/category/delete/<int:id>')
@login_required
def delete_category(id):
    category = Category.query.get_or_404(id)
    
    # Rimuoviamo solo le associazioni con i prodotti, non i prodotti stessi
    # I prodotti rimarranno nel database se sono associati ad altre categorie
    
    # Eliminiamo le sottocategorie
    for subcategory in category.children:
        # Rimuoviamo le associazioni con i prodotti delle sottocategorie
        subcategory.all_products = []
        db.session.delete(subcategory)
    
    # Rimuoviamo le associazioni con i prodotti della categoria principale
    category.all_products = []
    
    # Infine eliminiamo la categoria
    db.session.delete(category)
    db.session.commit()
    flash('Categoria eliminata con successo', 'success')
    return redirect(url_for('admin'))

@app.route('/edit_category/<int:category_id>', methods=['GET', 'POST'])
@login_required
def edit_category(category_id):
    category = Category.query.get_or_404(category_id)
    
    if request.method == 'POST':
        category.name = request.form['name']
        
        # Handle multiple parent categories
        parent_ids = request.form.getlist('parent_ids')
        # Clear existing parent relationships
        category.parents = []
        if parent_ids:
            # Add new parent relationships
            for parent_id in parent_ids:
                if parent_id:  # Skip empty values
                    parent = Category.query.get(int(parent_id))
                    if parent and parent.id != category.id:  # Avoid self-reference
                        category.parents.append(parent)
        
        category.icon = request.form.get('icon')
        category.position = request.form.get('position', 0)
        category.is_active = 'is_active' in request.form
        category.auto_activate = 'auto_activate' in request.form
        
        if category.auto_activate:
            category.active_days = request.form.get('active_days', '')
            category.active_start_time = request.form.get('active_start_time', '00:00')
            category.active_end_time = request.form.get('active_end_time', '23:59')
        
        try:
            db.session.commit()
            flash('Categoria aggiornata con successo!', 'success')
            return redirect(url_for('admin'))
        except Exception as e:
            db.session.rollback()
            flash(f'Errore durante l\'aggiornamento della categoria: {str(e)}', 'error')
    
    # Get all main categories for the form
    main_categories = Category.query.filter(Category.id != category_id).all()
    return render_template('edit_category.html', category=category, main_categories=main_categories)

# Product management routes
@app.route('/product/add', methods=['POST'])
@login_required
def add_product():
    # Importa la funzione di invalidazione della cache
    from cache_utils import invalidate_cache
    
    try:
        # Get selected categories
        category_ids = request.form.getlist('category_ids[]')
        if not category_ids:
            flash('Please select at least one category', 'error')
            return redirect(url_for('admin'))
            
        # Set the first selected category as the primary category
        primary_category_id = int(category_ids[0])
        
        # Determine the last position in the primary category
        last_position = db.session.query(db.func.max(Product.position)).filter_by(category_id=primary_category_id).scalar() or 0
        
        # Ottieni i tag dal form
        tags = request.form.get('tags', '')
        
        new_product = Product(
            name=request.form['name'],
            description=request.form['description'],
            price=float(request.form['price']),
            price_2=float(request.form.get('price_2', 0) or 0),
            price_2_label=request.form.get('price_2_label', ''),
            category_id=primary_category_id,
            image_url=request.form.get('image_url', ''),
            is_available=bool(request.form.get('is_available', True)),
            is_featured=bool(request.form.get('is_featured', False)),
            allergens=request.form.get('allergens', ''),
            tags=tags,
            position=last_position + 1,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Add the product to all selected categories
        categories = Category.query.filter(Category.id.in_(category_ids)).all()
        new_product.categories.extend(categories)
            
        db.session.add(new_product)
        db.session.commit()
        
        # Invalida la cache se ci sono tag
        if tags:
            invalidate_cache('menu_data')
            print("Cache del menu invalidata per nuovo prodotto con tag")
            
        flash('Prodotto aggiunto con successo!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Errore durante l\'aggiunta del prodotto: {str(e)}', 'danger')
    
    return redirect(url_for('admin'))

@app.route('/product/edit/<int:product_id>', methods=['GET', 'POST'])
@login_required
def edit_product(product_id):
    # Importa la funzione di invalidazione della cache
    from cache_utils import invalidate_cache
    
    product = Product.query.get_or_404(product_id)
    categories = Category.query.order_by(Category.position).all()
    
    if request.method == 'POST':
        try:
            # Get form data with proper type conversion and validation
            price = request.form.get('price', '')
            price_2 = request.form.get('price_2', '')
            position = request.form.get('position', product.position)
            category_ids = request.form.getlist('category_ids[]')
            
            # Validate required fields
            if not price or not category_ids:
                raise ValueError('Price and at least one category are required')
            
            # Update product attributes
            product.name = request.form.get('name')
            product.description = request.form.get('description')
            product.price = float(price)
            product.price_2 = float(price_2) if price_2 else 0
            product.price_2_label = request.form.get('price_2_label', '')
            
            # Set the first selected category as the primary category
            if category_ids:
                product.category_id = int(category_ids[0])
                
                # Update the many-to-many relationships
                product.categories = []
                for cat_id in category_ids:
                    category = Category.query.get(int(cat_id))
                    if category:
                        product.categories.append(category)
            
            product.image_url = request.form.get('image_url', '')
            product.is_available = 'is_available' in request.form
            product.is_featured = 'is_featured' in request.form
            product.allergens = request.form.get('allergens', '')
            
            # Controlla se ci sono modifiche ai tag per invalidare la cache
            old_tags = product.tags or ''
            new_tags = request.form.get('tags', '')
            
            product.tags = new_tags
            product.position = int(position)
            product.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            # Invalida la cache del menu quando vengono modificati i tag
            if old_tags != new_tags:
                invalidate_cache('menu_data')
                print("Cache del menu invalidata a causa di modifiche ai tag")
            
            flash('Prodotto aggiornato con successo!', 'success')
            return redirect(url_for('admin'))
        except ValueError as ve:
            db.session.rollback()
            flash(f'Errore di validazione: {str(ve)}', 'danger')
        except Exception as e:
            db.session.rollback()
            flash(f'Errore durante l\'aggiornamento del prodotto: {str(e)}', 'danger')
    
    return render_template('edit_product.html', product=product, categories=categories)

@app.route('/product/delete/<int:product_id>', methods=['GET', 'POST'])
@login_required
def delete_product(product_id):
    # Importa la funzione di invalidazione della cache
    from cache_utils import invalidate_cache
    
    product = Product.query.get_or_404(product_id)
    
    # Controlla se il prodotto ha tag prima di eliminarlo
    has_tags = bool(product.tags)
    
    db.session.delete(product)
    db.session.commit()
    
    # Invalida la cache se il prodotto aveva tag
    if has_tags:
        invalidate_cache('menu_data')
        print("Cache del menu invalidata dopo eliminazione prodotto con tag")
    
    flash('Prodotto eliminato con successo!')
    return redirect(url_for('admin'))

# API Routes per future integrazioni
@app.route('/api/menu')
def api_menu():
    # Importa il decoratore di cache
    from cache_utils import cache_response
    
    # Funzione interna che genera i dati del menu
    # Questa funzione sarà decorata con cache_response
    @cache_response('menu_data', duration=3600)  # Cache per 1 ora invece di 24 ore per dati più freschi
    def generate_menu_data():
        # Utilizziamo query ottimizzate con prefetch di relazioni per ridurre le query N+1
        from sqlalchemy.orm import joinedload, contains_eager
        from sqlalchemy import and_, or_, func
        
        # Step 1: Preparazione - carica tutte le categorie attive in una query efficiente
        all_categories = {}
        categories_query = Category.query.filter_by(is_active=True).order_by(Category.position)
        for category in categories_query:
            all_categories[category.id] = category
            
        # Step 2: Mappa le relazioni genitore-figlio
        parent_child_map = {}
        main_categories = []
        
        # Usa una query ottimizzata per ottenere tutte le relazioni in una volta
        relationships = db.session.query(
            category_relationships.c.parent_category_id,
            category_relationships.c.child_category_id
        ).all()
        
        for parent_id, child_id in relationships:
            if parent_id not in parent_child_map:
                parent_child_map[parent_id] = []
            parent_child_map[parent_id].append(child_id)
        
        # Identifica le categorie principali (senza genitori)
        for cat_id, category in all_categories.items():
            is_child = False
            for children in parent_child_map.values():
                if cat_id in children:
                    is_child = True
                    break
            if not is_child:
                main_categories.append(category)
        
        # Step 3: Ottieni tutti i prodotti disponibili in un'unica query efficiente
        all_active_products = {}
        products_categories_map = {}
        
        # Carica prodotti con join precaricati
        products_query = db.session.query(
            Product, Category
        ).join(
            product_categories, Product.id == product_categories.c.product_id
        ).join(
            Category, Category.id == product_categories.c.category_id
        ).filter(
            Product.is_available == True,
            Category.is_active == True
        ).options(
            joinedload(Product.categories)
        )
        
        # Organizza prodotti e relazioni
        for product, category in products_query:
            # Memorizza prodotto se non è già registrato
            if product.id not in all_active_products:
                all_active_products[product.id] = {
                    'id': product.id,
                    'name': product.name,
                    'description': product.description,
                    'price': product.price,
                    'price_2': product.price_2,
                    'price_2_label': product.price_2_label,
                    'image_url': product.image_url,
                    'allergens': product.allergens,
                    'tags': product.tags
                }
            
            # Mappa prodotto a categoria
            if category.id not in products_categories_map:
                products_categories_map[category.id] = []
            if product.id not in products_categories_map[category.id]:
                products_categories_map[category.id].append(product.id)
        
        # Step 4: Costruzione risultato JSON ottimizzato
        result = []
        
        # Ordina le categorie principali per posizione
        main_categories.sort(key=lambda x: x.position)
        
        for main_cat in main_categories:
            products_for_category = []
            
            # Aggiungi prodotti per questa categoria
            if main_cat.id in products_categories_map:
                for product_id in products_categories_map[main_cat.id]:
                    products_for_category.append(all_active_products[product_id])
            
            # Prepara struttura categoria principale
            cat_dict = {
                'id': main_cat.id,
                'name': main_cat.name,
                'products': products_for_category,
                'subcategories': []
            }
            
            # Aggiungi sottocategorie se esistono
            if main_cat.id in parent_child_map:
                subcategories = []
                for subcat_id in parent_child_map[main_cat.id]:
                    if subcat_id in all_categories and all_categories[subcat_id].is_active:
                        subcat = all_categories[subcat_id]
                        subcat_products = []
                        
                        # Aggiungi prodotti per questa sottocategoria
                        if subcat.id in products_categories_map:
                            for product_id in products_categories_map[subcat.id]:
                                subcat_products.append(all_active_products[product_id])
                        
                        subcategories.append({
                            'id': subcat.id,
                            'name': subcat.name,
                            'products': subcat_products
                        })
                
                # Ordina sottocategorie per posizione
                subcategories.sort(key=lambda x: all_categories[x['id']].position)
                cat_dict['subcategories'] = subcategories
            
            result.append(cat_dict)
        
        return result
    
    # Chiama la funzione decorata per ottenere i dati del menu con cache
    return jsonify(generate_menu_data())

# Rotta per filtrare prodotti per tag
@app.route('/tag/<tag>')
def products_by_tag(tag):
    # Ottieni tutti i prodotti con questo tag
    products = Product.query.filter(
        Product.tags.like(f'%{tag}%'), 
        Product.is_available == True
    ).order_by(Product.position).all()
    
    # Ottieni tutti i tag disponibili per mostrare nei pulsanti di filtro
    all_tags = set()
    for p in Product.query.filter(Product.is_available == True).all():
        if p.tags:
            for t in p.tags.split(','):
                all_tags.add(t.strip())
    
    # Ottieni preferenze tema
    theme = ThemePreference.query.first()
    if not theme:
        theme = ThemePreference()
        db.session.add(theme)
        db.session.commit()
    
    return render_template('tag_products.html', 
                          products=products,
                          current_tag=tag,
                          all_tags=sorted(all_tags),
                          theme=theme)

# Rotta per generare QR code del menu
@app.route('/qrcode')
def generate_qrcode():
    menu_url = request.host_url
    return render_template('qrcode.html', menu_url=menu_url)

# Rotta per gestione tema
@app.route('/admin/theme', methods=['GET', 'POST'])
@login_required
def manage_theme():
    theme = ThemePreference.query.first()
    if not theme:
        theme = ThemePreference()
        db.session.add(theme)
        db.session.commit()
    
    if request.method == 'POST':
        try:
            theme.theme_name = request.form.get('theme_name', 'default')
            theme.primary_color = request.form.get('primary_color', '#8B0000')
            theme.secondary_color = request.form.get('secondary_color', '#2c3e50')
            theme.show_allergens = 'show_allergens' in request.form
            theme.show_prices = 'show_prices' in request.form
            theme.custom_css = request.form.get('custom_css', '')
            
            db.session.commit()
            flash('Tema aggiornato con successo!', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'Errore durante l\'aggiornamento del tema: {str(e)}', 'danger')
    
    return render_template('theme.html', theme=theme)

# Rotta per ottenere la lista delle immagini nella directory images
@app.route('/api/images')
@login_required
def get_images():
    # Ottenere la path completa della directory images
    image_dir = os.path.join(app.static_folder, 'images')
    
    # Controllo se la directory esiste
    if not os.path.isdir(image_dir):
        return jsonify({'success': False, 'error': 'Directory not found'}), 404
    
    # Lista vuota per le immagini
    images = []
    
    # Estensioni valide per le immagini
    valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    
    # Recupera tutte le immagini nella directory
    for filename in os.listdir(image_dir):
        ext = os.path.splitext(filename)[1].lower()
        if ext in valid_extensions:
            # Crea un URL relativo per l'immagine
            image_url = url_for('static', filename=f'images/{filename}')
            images.append({
                'name': filename,
                'url': image_url
            })
    
    # Ordina per nome file
    images.sort(key=lambda x: x['name'])
    
    return jsonify(images)

# API per ordinare le categorie
@app.route('/api/reorder-categories', methods=['POST'])
@login_required
def reorder_categories():
    try:
        data = request.get_json()
        category_order = data.get('categories', [])
        
        for index, category_id in enumerate(category_order):
            category = Category.query.get(category_id)
            if category:
                category.position = index
        
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400

# API per ordinare i prodotti
@app.route('/api/reorder-products', methods=['POST'])
@login_required
def reorder_products():
    try:
        data = request.get_json()
        product_order = data.get('products', [])
        category_id = data.get('category_id')
        
        for index, product_id in enumerate(product_order):
            product = Product.query.get(product_id)
            if product:
                product.position = index
                if category_id:
                    product.category_id = category_id
        
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # Create admin user if it doesn't exist
        if not User.query.filter_by(username='admin').first():
            admin = User(
                username='admin',
                email='admin@example.com',
                password_hash=generate_password_hash('admin123'),  # Change this password in production
                last_login=datetime.utcnow()
            )
            db.session.add(admin)
            
            # Create default theme
            if not ThemePreference.query.first():
                default_theme = ThemePreference()
                db.session.add(default_theme)
            
            db.session.commit()
            
    app.run(debug=True, host='0.0.0.0', port=8082, threaded=True)
