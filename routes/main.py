import os
from flask import Blueprint, render_template, request, jsonify
from flask_login import login_required, current_user
import google.generativeai as genai
from models import Chamado, Interacao, Notificacao, User
from extensions import db

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
@login_required
def index():
    return render_template('services.html')

@main_bp.route('/abrir-chamado')
@login_required
def abrir_chamado():
    return render_template('novo_chamado.html')

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
        
    descricao = dados.get('descricao')
    localizacao = dados.get('localizacao')
    
    if not descricao or not localizacao:
        return jsonify({"erro": "Descrição e localização são obrigatórios"}), 400

    is_critico = dados.get('problema_critico') in ['on', True, 'true', '1']
    prioridade_definida = 'alta' if is_critico else 'normal'

    # --- INTEGRAÇÃO COM GEMINI ---
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return jsonify({"erro": "Chave da API do Gemini não configurada no servidor."}), 500
        
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-flash-latest')
        
        prompt = f"""Você é um assistente rigoroso do Instituto Federal (IF) responsável por fazer a triagem de chamados.
Sua única tarefa é ler a descrição do problema e responder ESTRITAMENTE com a sigla do setor responsável. Não adicione nenhuma outra palavra.

Regras de Classificação:
- CAE: Apoio em Sala e Itens perdidos (Ex: Falta carteira, giz, apagador, ar condicionado pingando na mesa, algo esquecido).
- CTI: Tecnologia e Equipamentos (Ex: Projetor não liga, computador sem internet, software não abre).
- CAP: Estrutura, Manutenção e Limpeza (Ex: Lâmpada queimada, porta quebrada, tomada com curto, lixo cheio, banheiro sujo, mato alto).

Regra de Recusa:
- Se a mensagem não tiver absolutamente NADA a ver com os problemas citados, ou for uma brincadeira absurda (ex: pedir comida, falar de jogos), você deve responder exatamente assim: REJEITADO: <Motivo educado explicando que o sistema é exclusivo para problemas de infraestrutura/tecnologia/ensino do IF>.

Mensagem do Usuário: {descricao}"""

        response = model.generate_content(prompt)
        resposta_ia = response.text.strip()
        
        if resposta_ia.startswith("REJEITADO:"):
            # Retorna o erro com a mensagem gerada pela IA
            return jsonify({"erro": resposta_ia}), 400
            
        # Garante que a IA retornou uma categoria válida
        categorias_validas = ['CAE', 'CTI', 'CAP']
        categoria_definida = resposta_ia if resposta_ia in categorias_validas else 'CAP' # Padrão para falha

    except Exception as e:
        print(f"Erro na IA: {e}")
        return jsonify({"erro": "Falha ao analisar a descrição usando IA."}), 500

    novo_chamado = Chamado(
        localizacao=localizacao,
        categoria=categoria_definida,
        descricao=descricao,
        prioridade=prioridade_definida,
        user_id=current_user.id
    )
    
    try:
        db.session.add(novo_chamado)
        db.session.commit()
        return jsonify({"mensagem": "Chamado aberto com sucesso!", "id": novo_chamado.id, "setor": categoria_definida}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": "Erro ao salvar no banco"}), 500

@main_bp.route('/api/chamados', methods=['GET'])
@login_required
def listar_chamados():
    if current_user.role in ['adm', 'gestor', 'professor']:
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

@main_bp.route('/api/chamados/<int:id>/transferir', methods=['PUT'])
@login_required
def transferir_chamado(id):
    dados = request.get_json()
    novo_setor = dados.get('setor')
    
    if novo_setor not in ['CAE', 'CTI', 'CAP']:
        return jsonify({"erro": "Setor inválido"}), 400
        
    chamado = Chamado.query.get(id)
    if not chamado:
        return jsonify({"erro": "Chamado não encontrado"}), 404
        
    # Dependendo da regra, apenas ADM ou o próprio usuário poderia transferir. 
    # Vou deixar aberto para qualquer um logado que consiga ver o chamado, 
    # mas o ideal seria checar permissão (ex: só ADM ou a equipe de gestão)
    if current_user.role != 'adm' and chamado.user_id != current_user.id:
         return jsonify({"erro": "Sem permissão"}), 403

    try:
        chamado.categoria = novo_setor
        
        # Notificar o autor do chamado
        notif = Notificacao(
            user_id=chamado.user_id,
            titulo="Chamado Transferido",
            mensagem=f"Seu chamado #{chamado.id} foi transferido para o setor {novo_setor}.",
            link=f"/painel"
        )
        db.session.add(notif)
        
        db.session.commit()
        return jsonify({"mensagem": f"Chamado transferido para {novo_setor} com sucesso"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": "Erro ao atualizar banco"}), 500

@main_bp.route('/api/chamados/<int:id>/interacoes', methods=['GET'])
@login_required
def listar_interacoes(id):
    try:
        chamado = Chamado.query.get_or_404(id)
        
        # Validação de acesso
        if current_user.role == 'aluno' and chamado.user_id != current_user.id:
            return jsonify({"erro": "Acesso negado"}), 403

        interacoes = []
        for inter in chamado.interacoes:
            # Tratamento defensivo caso data_hora venha nula ou em formato inesperado
            try:
                data_str = inter.data_hora.strftime("%d/%m/%Y %H:%M") if inter.data_hora else "Sem data"
            except:
                data_str = str(inter.data_hora)

            interacoes.append({
                "id": inter.id,
                "autor": inter.user.nome_completo if inter.user else "Sistema",
                "mensagem": inter.mensagem,
                "data_hora": data_str,
                "eh_sistema": inter.eh_sistema,
                "autor_role": inter.user.role if inter.user else None
            })
        
        return jsonify({
            "status_atual": chamado.status,
            "interacoes": interacoes,
            "resolucao": chamado.resolucao,
            "justificativa_cancelamento": chamado.justificativa_cancelamento
        }), 200
    except Exception as e:
        print(f"Erro em listar_interacoes: {e}")
        return jsonify({"erro": f"Erro interno do servidor: {e}"}), 500

@main_bp.route('/api/chamados/<int:id>/interagir', methods=['POST'])
@login_required
def interagir_chamado(id):
    chamado = Chamado.query.get_or_404(id)
    
    # Pode interagir: ADM, Gestor do Setor Atual, Gestor Geral, ou o Autor
    pode_interagir = False
    if current_user.role == 'adm':
        pode_interagir = True
    elif current_user.id == chamado.user_id:
        pode_interagir = True
    elif current_user.role in ['gestor', 'professor']:
        if current_user.setor is None or current_user.setor == chamado.categoria:
            pode_interagir = True
            
    if not pode_interagir:
        return jsonify({"erro": "Você não tem permissão para interagir neste chamado."}), 403

    dados = request.get_json()
    mensagem = dados.get('mensagem')
    if not mensagem:
        return jsonify({"erro": "Mensagem vazia."}), 400
        
    try:
        nova_interacao = Interacao(
            chamado_id=chamado.id,
            user_id=current_user.id,
            mensagem=mensagem
        )
        db.session.add(nova_interacao)
        
        # Sistema de Notificações
        if current_user.id == chamado.user_id:
            # Autor comentou: Notificar gestores do setor e admins
            gestores = User.query.filter(User.role.in_(['gestor', 'professor', 'adm'])).all()
            for g in gestores:
                if g.setor is None or g.setor == chamado.categoria:
                    notif = Notificacao(
                        user_id=g.id,
                        titulo=f"Nova mensagem (Chamado #{chamado.id})",
                        mensagem=f"O autor enviou uma nova interação no chamado de {chamado.categoria}.",
                        link="/painel"
                    )
                    db.session.add(notif)
        else:
            # Equipe comentou: Notificar o autor
            notif = Notificacao(
                user_id=chamado.user_id,
                titulo=f"Resposta no Chamado #{chamado.id}",
                mensagem=f"A equipe de {chamado.categoria} respondeu seu chamado.",
                link="/painel"
            )
            db.session.add(notif)
            print(f"Notificacao criada para o autor {chamado.user_id}")
            
        db.session.commit()
        return jsonify({"mensagem": "Comentário adicionado!"}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao interagir chamado: {e}")
        return jsonify({"erro": f"Erro ao salvar comentário: {e}"}), 500

@main_bp.route('/api/chamados/<int:id>/status', methods=['PUT'])
@login_required
def alterar_status(id):
    chamado = Chamado.query.get_or_404(id)
    
    # Só gestores do setor (ou sem setor) e adm podem mudar status
    if current_user.role not in ['adm', 'gestor', 'professor']:
        return jsonify({"erro": "Sem permissão"}), 403
    if current_user.setor and current_user.setor != chamado.categoria:
        return jsonify({"erro": "Chamado pertence a outro setor."}), 403

    dados = request.get_json()
    novo_status = dados.get('status')
    resolucao = dados.get('resolucao')
    
    if novo_status not in ['em atendimento', 'finalizado']:
        return jsonify({"erro": "Status inválido."}), 400
        
    if novo_status == 'finalizado' and not resolucao:
        return jsonify({"erro": "É obrigatório enviar a resolução para finalizar."}), 400

    try:
        chamado.status = novo_status
        
        msg_sistema = f"Status alterado para: {novo_status.upper()}"
        if novo_status == 'finalizado':
            chamado.resolucao = resolucao
            msg_sistema += f"\nResolução: {resolucao}"
            
        interacao_sistema = Interacao(
            chamado_id=chamado.id,
            user_id=current_user.id,
            mensagem=msg_sistema,
            eh_sistema=True
        )
        db.session.add(interacao_sistema)
        
        # Notificar o autor
        notif = Notificacao(
            user_id=chamado.user_id,
            titulo=f"Status Atualizado",
            mensagem=f"Seu chamado #{chamado.id} agora está: {novo_status.upper()}",
            link="/painel"
        )
        db.session.add(notif)
        
        db.session.commit()
        return jsonify({"mensagem": "Status atualizado com sucesso!"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao alterar status: {e}")
        return jsonify({"erro": f"Erro ao salvar status: {e}"}), 500

@main_bp.route('/api/chamados/<int:id>/cancelar', methods=['PUT'])
@login_required
def cancelar_chamado(id):
    chamado = Chamado.query.get_or_404(id)
    
    dados = request.get_json()
    justificativa = dados.get('justificativa')
    
    if not justificativa:
        return jsonify({"erro": "A justificativa é obrigatória para cancelar."}), 400

    # Pode cancelar: Autor do chamado ou Gestores competentes
    pode_cancelar = False
    if current_user.id == chamado.user_id:
        pode_cancelar = True
    elif current_user.role in ['adm', 'gestor', 'professor']:
        if current_user.setor is None or current_user.setor == chamado.categoria:
            pode_cancelar = True
            
    if not pode_cancelar:
        return jsonify({"erro": "Você não tem permissão para cancelar este chamado."}), 403

    try:
        chamado.status = 'cancelado'
        chamado.justificativa_cancelamento = justificativa
        
        interacao_sistema = Interacao(
            chamado_id=chamado.id,
            user_id=current_user.id,
            mensagem=f"Chamado CANCELADO.\nJustificativa: {justificativa}",
            eh_sistema=True
        )
        db.session.add(interacao_sistema)
        
        if current_user.id != chamado.user_id:
            notif = Notificacao(
                user_id=chamado.user_id,
                titulo=f"Chamado Cancelado",
                mensagem=f"Seu chamado #{chamado.id} foi cancelado pela equipe.",
                link="/painel"
            )
            db.session.add(notif)
            
        db.session.commit()
        return jsonify({"mensagem": "Chamado cancelado com sucesso!"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao cancelar chamado: {e}")
        return jsonify({"erro": f"Erro ao cancelar chamado: {e}"}), 500
