from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from models import Anuncio, User, Notificacao
from extensions import db
from services.ai_service import analisar_anuncio

comunidade_bp = Blueprint('comunidade', __name__, url_prefix='/comunidade')

@comunidade_bp.route('/')
@login_required
def index():
    # Pega todos os anúncios aprovados, ordenados por data (mais recentes primeiro)
    anuncios = Anuncio.query.filter_by(status_moderacao='aprovado').order_by(Anuncio.data_criacao.desc()).all()
    return render_template('comunidade/index.html', anuncios=anuncios)

@comunidade_bp.route('/novo', methods=['GET', 'POST'])
@login_required
def novo_anuncio():
    if request.method == 'POST':
        titulo = request.form.get('titulo')
        conteudo = request.form.get('conteudo')
        
        if not titulo or not conteudo:
            flash('Título e conteúdo são obrigatórios.', 'danger')
            return redirect(url_for('comunidade.novo_anuncio'))
            
        # Determina o tipo de anúncio com base no perfil do usuário
        tipo_anuncio = 'oficial' if current_user.role in ['adm', 'gestor', 'professor'] else 'comum'
        
        # Analisa o conteúdo com IA
        analise = analisar_anuncio(titulo, conteudo)
        
        status = analise.get('status', 'aprovado')
        motivo = analise.get('motivo', '')
        tags = ','.join(analise.get('tags', []))
        
        if status == 'rejeitado':
            flash(f'Seu anúncio foi rejeitado pela moderação automática. Motivo: {motivo}', 'danger')
            return redirect(url_for('comunidade.index'))
            
        anuncio = Anuncio(
            titulo=titulo,
            conteudo=conteudo,
            tipo=tipo_anuncio,
            autor_id=current_user.id,
            status_moderacao=status,
            tags=tags
        )
        
        db.session.add(anuncio)
        
        # Notificar usuários se for um aviso oficial
        if tipo_anuncio == 'oficial':
            todos_usuarios = User.query.filter(User.id != current_user.id).all()
            for u in todos_usuarios:
                notif = Notificacao(
                    user_id=u.id,
                    titulo="Novo Aviso Oficial",
                    mensagem=f"Foi publicado um novo aviso: {titulo}",
                    link="/comunidade"
                )
                db.session.add(notif)

        db.session.commit()
        flash('Anúncio publicado com sucesso!', 'success')
        return redirect(url_for('comunidade.index'))
        
    return render_template('comunidade/novo.html')

@comunidade_bp.route('/editar/<int:id>', methods=['GET', 'POST'])
@login_required
def editar_anuncio(id):
    anuncio = Anuncio.query.get_or_404(id)
    
    # Validação de permissão: apenas dono ou admin
    if anuncio.autor_id != current_user.id and current_user.role != 'adm':
        flash('Você não tem permissão para editar este anúncio.', 'danger')
        return redirect(url_for('comunidade.index'))
        
    if request.method == 'POST':
        titulo = request.form.get('titulo')
        conteudo = request.form.get('conteudo')
        
        # Re-analisar na edição para evitar alteração para conteúdo impróprio
        analise = analisar_anuncio(titulo, conteudo)
        status = analise.get('status', 'aprovado')
        
        if status == 'rejeitado':
            flash(f'As alterações foram rejeitadas pela moderação. Motivo: {analise.get("motivo")}', 'danger')
            return redirect(url_for('comunidade.editar_anuncio', id=anuncio.id))
            
        anuncio.titulo = titulo
        anuncio.conteudo = conteudo
        anuncio.tags = ','.join(analise.get('tags', []))
        
        db.session.commit()
        flash('Anúncio atualizado com sucesso!', 'success')
        return redirect(url_for('comunidade.index'))
        
    return render_template('comunidade/editar.html', anuncio=anuncio)

@comunidade_bp.route('/deletar/<int:id>', methods=['POST'])
@login_required
def deletar_anuncio(id):
    anuncio = Anuncio.query.get_or_404(id)
    
    # Validação de permissão: apenas dono ou admin
    if anuncio.autor_id != current_user.id and current_user.role != 'adm':
        flash('Você não tem permissão para deletar este anúncio.', 'danger')
        return redirect(url_for('comunidade.index'))
        
    db.session.delete(anuncio)
    db.session.commit()
    flash('Anúncio deletado com sucesso.', 'success')
    return redirect(url_for('comunidade.index'))
