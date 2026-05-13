from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from extensions import db
from models import Notificacao

notificacoes_bp = Blueprint('notificacoes', __name__, url_prefix='/api/notificacoes')

@notificacoes_bp.route('', methods=['GET'])
@notificacoes_bp.route('/', methods=['GET'])
@login_required
def get_notificacoes():
    print(f"Buscando notificações para o usuário {current_user.id}...")
    nao_lidas = Notificacao.query.filter_by(user_id=current_user.id, lida=False).order_by(Notificacao.data_criacao.desc()).all()
    
    # Limitar para não sobrecarregar
    nao_lidas = nao_lidas[:20]

    resultado = []
    for notif in nao_lidas:
        resultado.append({
            "id": notif.id,
            "titulo": notif.titulo,
            "mensagem": notif.mensagem,
            "link": notif.link,
            "data_criacao": notif.data_criacao.strftime("%d/%m/%Y %H:%M")
        })
        
    return jsonify({"notificacoes": resultado}), 200

@notificacoes_bp.route('/<int:id>/lida/', methods=['PUT'])
@login_required
def marcar_lida(id):
    notificacao = Notificacao.query.get_or_404(id)
    if notificacao.user_id != current_user.id:
        return jsonify({"erro": "Acesso negado"}), 403
        
    notificacao.lida = True
    db.session.commit()
    return jsonify({"sucesso": True}), 200

@notificacoes_bp.route('/ler_todas/', methods=['PUT'])
@login_required
def ler_todas():
    notificacoes = Notificacao.query.filter_by(user_id=current_user.id, lida=False).all()
    for n in notificacoes:
        n.lida = True
    db.session.commit()
    return jsonify({"sucesso": True}), 200
