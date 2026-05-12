import os
from flask import Flask
from extensions import db, login_manager
from models import User

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'hackaton-secret-key-123'
    
    # --- CONFIGURAÇÃO DO BANCO ---
    database_uri = os.getenv('DATABASE_URL', 'sqlite:///projeto.db')
    
    if database_uri:
        if database_uri.startswith("mysql://"):
            database_uri = database_uri.replace("mysql://", "mysql+pymysql://", 1)
        elif database_uri.startswith("postgres://"):
            database_uri = database_uri.replace("postgres://", "postgresql://", 1)
            
    app.config['SQLALCHEMY_DATABASE_URI'] = database_uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Inicializa as extensões
    db.init_app(app)
    login_manager.init_app(app)
    
    # Configurações do LoginManager
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Por favor, faça login para acessar esta página.'
    login_manager.login_message_category = 'warning'

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Importa e registra os Blueprints
    from routes.auth import auth_bp
    from routes.main import main_bp
    from routes.admin import admin_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(admin_bp)

    # Criação das tabelas
    with app.app_context():
        if database_uri:
            db.create_all()

    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
