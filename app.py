import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

# --- CONFIGURAÇÃO DO BANCO ---
database_uri = os.getenv('DATABASE_URL')

if database_uri and database_uri.startswith("mysql://"):
    database_uri = database_uri.replace("mysql://", "mysql+pymysql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_uri or 'sqlite:///mascote_local.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- MODELO DE EXEMPLO ---
class Mascote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(50), nullable=False)
    nivel = db.Column(db.Integer, default=1)
    energia = db.Column(db.Integer, default=0)

with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return "Banco MySQL conectado com sucesso!"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)