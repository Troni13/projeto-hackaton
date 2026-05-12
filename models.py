from extensions import db
from datetime import datetime, timezone, timedelta
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    nome_completo = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='aluno') # adm, aluno, gestor, professor
    setor = db.Column(db.String(20), nullable=True) # CAE, CAP, CTI

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
    resolucao = db.Column(db.Text, nullable=True)
    justificativa_cancelamento = db.Column(db.Text, nullable=True)
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship('User', backref=db.backref('chamados', lazy=True))

class Interacao(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    chamado_id = db.Column(db.Integer, db.ForeignKey('chamado.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) # Nullable para msgs do sistema
    mensagem = db.Column(db.Text, nullable=False)
    data_hora = db.Column(db.DateTime, default=lambda: datetime.now(timezone(timedelta(hours=-3))))
    eh_sistema = db.Column(db.Boolean, default=False)

    chamado = db.relationship('Chamado', backref=db.backref('interacoes', lazy=True, order_by='Interacao.data_hora'))
    user = db.relationship('User')

class Anuncio(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    conteudo = db.Column(db.Text, nullable=False)
    tipo = db.Column(db.String(50), nullable=False, default='comum') # comum, oficial
    autor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    data_criacao = db.Column(db.DateTime, default=lambda: datetime.now(timezone(timedelta(hours=-3))))
    status_moderacao = db.Column(db.String(20), default='aprovado') # aprovado, rejeitado
    motivo_rejeicao = db.Column(db.Text, nullable=True)
    tags = db.Column(db.String(200), nullable=True)

    autor = db.relationship('User', backref=db.backref('anuncios', lazy=True))
