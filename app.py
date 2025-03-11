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
app.config['SECRET_KEY'] = secrets.token_hex(16)  # Genera una chiave segreta casuale
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

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=True)
    products = db.relationship('Product', backref='category', lazy=True)
    children = db.relationship('Category',
                             backref=db.backref('parent', remote_side=[id]),
                             lazy='dynamic')
    position = db.Column(db.Integer, default=0)  # Per ordinare le categorie
    is_active = db.Column(db.Boolean, default=True)  # Per nascondere temporaneamente categorie
    icon = db.Column(db.String(100))  # URL icona per la categoria
    
    # Campi per l'attivazione automatica
    auto_activate = db.Column(db.Boolean, default=False)  # Attiva/disattiva automazione
    active_days = db.Column(db.String(100), default="0,1,2,3,4,5,6")  # Giorni attivi (0=lunedi, 6=domenica)
    active_start_time = db.Column(db.String(5), default="00:00")  # Orario inizio (formato HH:MM)
    active_end_time = db.Column(db.String(5), default="23:59")  # Orario fine (formato HH:MM)

    def get_subcategories(self):
        return self.children.filter_by(is_active=True).order_by(Category.position).all()

    def is_subcategory(self):
        return self.parent_id is not None
        
    def active_products(self):
        return [p for p in self.products if p.is_available]
        
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

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    price_2 = db.Column(db.Float)  # Secondo prezzo opzionale
    price_2_label = db.Column(db.String(20))  # Etichetta per il secondo prezzo
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
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
        Category.parent_id.is_(None),
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
    # Aggiorna lo stato delle categorie automatiche
    update_auto_activate_categories()
    
    products = Product.query.order_by(Product.category_id, Product.position).all()
    main_categories = Category.query.filter_by(parent_id=None).order_by(Category.position).all()
    all_categories = Category.query.order_by(Category.parent_id, Category.position).all()
    theme = ThemePreference.query.first()
    
    # Conta prodotti non disponibili
    unavailable_count = Product.query.filter_by(is_available=False).count()
    # Conta categorie non attive
    inactive_categories = Category.query.filter_by(is_active=False).count()
    # Conta categorie con attivazione automatica
    auto_categories = Category.query.filter_by(auto_activate=True).count()
    
    return render_template('admin.html', 
                          products=products, 
                          main_categories=main_categories, 
                          all_categories=all_categories,
                          theme=theme,
                          stats={
                              'product_count': len(products),
                              'category_count': len(all_categories),
                              'unavailable_count': unavailable_count,
                              'inactive_categories': inactive_categories,
                              'auto_categories': auto_categories
                          })

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('admin'))
        
    if request.method == 'POST':
        user = User.query.filter_by(username=request.form['username']).first()
        if user and check_password_hash(user.password_hash, request.form['password']):
            login_user(user, remember=True)
            
            # Aggiorna data ultimo accesso
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            next_page = request.args.get('next')
            return redirect(next_page or url_for('admin'))
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
    parent_id = request.form.get('parent_id')
    
    print(f"Name: {name}")
    print(f"Parent ID: {parent_id}")
    
    if parent_id and parent_id != '':
        parent_id = int(parent_id)
        print(f"Converting parent_id to int: {parent_id}")
    else:
        parent_id = None
        print("No parent_id provided, setting to None")
    
    try:
        new_category = Category(name=name, parent_id=parent_id)
        db.session.add(new_category)
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
    
    # Prima eliminiamo tutti i prodotti nella categoria e nelle sue sottocategorie
    for product in category.products:
        db.session.delete(product)
    
    # Eliminiamo i prodotti nelle sottocategorie
    for subcategory in category.children:
        for product in subcategory.products:
            db.session.delete(product)
        db.session.delete(subcategory)
    
    # Infine eliminiamo la categoria
    db.session.delete(category)
    db.session.commit()
    flash('Categoria e relativi prodotti eliminati con successo', 'success')
    return redirect(url_for('admin'))

@app.route('/category/edit/<int:category_id>', methods=['GET', 'POST'])
@login_required
def edit_category(category_id):
    category = Category.query.get_or_404(category_id)
    main_categories = Category.query.filter_by(parent_id=None).order_by(Category.position).all()
    
    if request.method == 'POST':
        try:
            category.name = request.form.get('name')
            
            # Gestione parent_id: se vuoto o uguale all'ID della categoria corrente, impostare a None
            parent_id = request.form.get('parent_id')
            if parent_id and parent_id != '':
                parent_id = int(parent_id)
                if parent_id == category.id:  # Evita riferimenti circolari
                    parent_id = None
            else:
                parent_id = None
            
            category.parent_id = parent_id
            category.icon = request.form.get('icon', '')
            category.position = int(request.form.get('position', category.position))
            category.is_active = 'is_active' in request.form
            
            # Gestione attivazione automatica
            category.auto_activate = 'auto_activate' in request.form
            
            if category.auto_activate:
                category.active_days = request.form.get('active_days', '0,1,2,3,4,5,6')
                category.active_start_time = request.form.get('active_start_time', '00:00')
                category.active_end_time = request.form.get('active_end_time', '23:59')
                
                # Assicurati che ci sia almeno un giorno selezionato
                if not category.active_days:
                    category.active_days = '0,1,2,3,4,5,6'  # Default a tutti i giorni
            
            db.session.commit()
            flash('Categoria aggiornata con successo!', 'success')
            return redirect(url_for('admin'))
        except Exception as e:
            db.session.rollback()
            flash(f'Errore durante l\'aggiornamento della categoria: {str(e)}', 'danger')
    
    return render_template('edit_category.html', category=category, main_categories=main_categories)

# Product management routes
@app.route('/product/add', methods=['POST'])
@login_required
def add_product():
    try:
        # Determina l'ultima posizione nella categoria
        category_id = int(request.form['category_id'])
        last_position = db.session.query(db.func.max(Product.position)).filter_by(category_id=category_id).scalar() or 0
        
        new_product = Product(
            name=request.form['name'],
            description=request.form['description'],
            price=float(request.form['price']),
            price_2=float(request.form.get('price_2', 0) or 0),
            price_2_label=request.form.get('price_2_label', ''),
            category_id=category_id,
            image_url=request.form.get('image_url', ''),
            is_available=bool(request.form.get('is_available', True)),
            is_featured=bool(request.form.get('is_featured', False)),
            allergens=request.form.get('allergens', ''),
            tags=request.form.get('tags', ''),
            position=last_position + 1,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.session.add(new_product)
        db.session.commit()
        flash('Prodotto aggiunto con successo!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Errore durante l\'aggiunta del prodotto: {str(e)}', 'danger')
    
    return redirect(url_for('admin'))

@app.route('/product/edit/<int:product_id>', methods=['GET', 'POST'])
@login_required
def edit_product(product_id):
    product = Product.query.get_or_404(product_id)
    categories = Category.query.order_by(Category.parent_id, Category.position).all()
    
    if request.method == 'POST':
        try:
            product.name = request.form.get('name')
            product.description = request.form.get('description')
            product.price = float(request.form.get('price', 0))
            product.price_2 = float(request.form.get('price_2', 0) or 0)
            product.price_2_label = request.form.get('price_2_label', '')
            product.category_id = int(request.form.get('category_id'))
            product.image_url = request.form.get('image_url', '')
            product.is_available = 'is_available' in request.form
            product.is_featured = 'is_featured' in request.form
            product.allergens = request.form.get('allergens', '')
            product.tags = request.form.get('tags', '')
            product.position = int(request.form.get('position', product.position))
            product.updated_at = datetime.utcnow()
            
            db.session.commit()
            flash('Prodotto aggiornato con successo!', 'success')
            return redirect(url_for('admin'))
        except Exception as e:
            db.session.rollback()
            flash(f'Errore durante l\'aggiornamento del prodotto: {str(e)}', 'danger')
    
    return render_template('edit_product.html', product=product, categories=categories)

@app.route('/product/delete/<int:product_id>', methods=['GET', 'POST'])
@login_required
def delete_product(product_id):
    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    flash('Prodotto eliminato con successo!')
    return redirect(url_for('admin'))

# API Routes per future integrazioni
@app.route('/api/menu')
def api_menu():
    categories = Category.query.filter_by(is_active=True, parent_id=None).order_by(Category.position).all()
    result = []
    
    for category in categories:
        cat_dict = {
            'id': category.id,
            'name': category.name,
            'products': [],
            'subcategories': []
        }
        
        # Aggiungi prodotti della categoria principale
        for product in category.products:
            if product.is_available:
                cat_dict['products'].append({
                    'id': product.id,
                    'name': product.name,
                    'description': product.description,
                    'price': product.price,
                    'price_2': product.price_2,
                    'price_2_label': product.price_2_label,
                    'image_url': product.image_url,
                    'allergens': product.allergens,
                    'tags': product.tags
                })
        
        # Aggiungi sottocategorie
        for subcategory in category.get_subcategories():
            subcat_dict = {
                'id': subcategory.id,
                'name': subcategory.name,
                'products': []
            }
            
            # Aggiungi prodotti della sottocategoria
            for product in subcategory.products:
                if product.is_available:
                    subcat_dict['products'].append({
                        'id': product.id,
                        'name': product.name,
                        'description': product.description,
                        'price': product.price,
                        'price_2': product.price_2,
                        'price_2_label': product.price_2_label,
                        'image_url': product.image_url,
                        'allergens': product.allergens,
                        'tags': product.tags
                    })
            
            cat_dict['subcategories'].append(subcat_dict)
        
        result.append(cat_dict)
    
    return jsonify(result)

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
