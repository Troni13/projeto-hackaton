from extensions import db
from datetime import datetime, timezone, timedelta
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    nome_completo = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='aluno') # adm, aluno, equipe_gestora

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Chamado(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    localizacao = db.Column(db.String(100), nullable=False) 
    categoria = db.Column(db.String(50), nullable=False)
    descricao = db.Column(db.Text, nullable=False)
    prioridade = db.Column(db.String(20), default='normal')
    status = db.Column(db.String(20), default='aberto')
    data_abertura = db.Column(db.DateTime, default=lambda: datetime.now(timezone(timedelta(hours=-3))))
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship('User', backref=db.backref('chamados', lazy=True))
