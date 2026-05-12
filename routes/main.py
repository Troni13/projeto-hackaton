from flask import Blueprint, render_template, request, jsonify
from flask_login import login_required, current_user
from models import Chamado
from extensions import db

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
@login_required
def index():
    return render_template('index.html')

@main_bp.route('/painel')
@login_required
def painel():
    return render_template('painel.html')

@main_bp.route('/api/chamados', methods=['POST'])
@login_required
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
        prioridade=prioridade_definida,
        user_id=current_user.id
    )
    
    try:
        db.session.add(novo_chamado)
        db.session.commit()
        return jsonify({"mensagem": "Chamado aberto com sucesso!", "id": novo_chamado.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": "Erro ao salvar no banco"}), 500

@main_bp.route('/api/chamados', methods=['GET'])
@login_required
def listar_chamados():
    if current_user.role == 'adm':
        chamados = Chamado.query.order_by(Chamado.data_abertura.desc()).all()
    else:
        chamados = Chamado.query.filter_by(user_id=current_user.id).order_by(Chamado.data_abertura.desc()).all()
        
    lista = []
    for c in chamados:
        lista.append({
            "id": c.id,
            "localizacao": c.localizacao,
            "categoria": c.categoria,
            "descricao": c.descricao,
            "prioridade": c.prioridade,
            "status": c.status,
            "data_abertura": c.data_abertura.strftime("%d/%m/%Y %H:%M"),
            "autor": c.user.nome_completo if c.user else "Desconhecido"
        })
    return jsonify(lista), 200
