import os
from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)

# --- CONFIGURAÇÃO DO BANCO ---
database_uri = os.getenv('DATABASE_URL')

if database_uri:
    if database_uri.startswith("mysql://"):
        database_uri = database_uri.replace("mysql://", "mysql+pymysql://", 1)
    elif database_uri.startswith("postgres://"):
        database_uri = database_uri.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- MODELO: TABELA DE CHAMADOS ---
class Chamado(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    localizacao = db.Column(db.String(100), nullable=False) 
    categoria = db.Column(db.String(50), nullable=False)
    descricao = db.Column(db.Text, nullable=False)
    prioridade = db.Column(db.String(20), default='normal')
    status = db.Column(db.String(20), default='aberto')
    data_abertura = db.Column(db.DateTime, default=datetime.utcnow)

with app.app_context():
    if database_uri:
        db.create_all()

# --- ROTAS DE NAVEGAÇÃO ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/painel')
def painel():
    return render_template('painel.html')

# --- ROTAS DA API ---
@app.route('/api/chamados', methods=['POST'])
def criar_chamado():
    dados = request.get_json(silent=True) or request.form.to_dict()

    if not dados:
        return jsonify({"erro": "Nenhum dado recebido"}), 400

    is_critico = dados.get('problema_critico') in ['on', True, 'true', '1']
    prioridade_definida = 'alta' if is_critico else 'normal'

    novo_chamado = Chamado(
        localizacao=dados.get('localizacao'),
        categoria=dados.get('categoria'),
        descricao=dados.get('descricao'),
        prioridade=prioridade_definida
    )
    
    try:
        db.session.add(novo_chamado)
        db.session.commit()
        return jsonify({"mensagem": "Chamado aberto com sucesso!", "id": novo_chamado.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": "Erro ao salvar no banco"}), 500

@app.route('/api/chamados', methods=['GET'])
def listar_chamados():
    chamados = Chamado.query.order_by(Chamado.data_abertura.desc()).all()
    lista = []
    for c in chamados:
        lista.append({
            "id": c.id,
            "localizacao": c.localizacao,
            "categoria": c.categoria,
            "descricao": c.descricao,
            "prioridade": c.prioridade,
            "status": c.status,
            "data_abertura": c.data_abertura.strftime("%d/%m/%Y %H:%M")
        })
    return jsonify(lista), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)