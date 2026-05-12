from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from functools import wraps
from models import User
from extensions import db

admin_bp = Blueprint('admin', __name__, url_prefix='/adm')

# Decorator para garantir que só ADM acessa essas rotas
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role != 'adm':
            flash('Acesso negado. Você não tem permissão de Administrador.', 'danger')
            return redirect(url_for('main.painel'))
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/usuarios')
@login_required
@admin_required
def gerenciar_usuarios():
    users = User.query.all()
    return render_template('admin/usuarios.html', users=users)

@admin_bp.route('/usuarios/editar/<int:id>', methods=['POST'])
@login_required
@admin_required
def editar_usuario(id):
    user = User.query.get_or_404(id)
    
    # Não permitir que o adm altere a si mesmo acidentalmente por aqui (boa prática)
    if user.id == current_user.id:
        flash('Para editar sua própria conta, use o menu de perfil (em breve).', 'warning')
        return redirect(url_for('admin.gerenciar_usuarios'))
        
    novo_role = request.form.get('role')
    novo_setor = request.form.get('setor')
    
    # Se o perfil for 'aluno' ou 'adm', não faz sentido ter setor designado (limpamos)
    if novo_role in ['aluno', 'adm']:
        novo_setor = None
    elif novo_setor == "":
        novo_setor = None
        
    user.role = novo_role
    user.setor = novo_setor
    
    db.session.commit()
    flash(f'Usuário {user.username} atualizado com sucesso!', 'success')
    return redirect(url_for('admin.gerenciar_usuarios'))

@admin_bp.route('/usuarios/deletar/<int:id>', methods=['POST'])
@login_required
@admin_required
def deletar_usuario(id):
    user = User.query.get_or_404(id)
    if user.id == current_user.id:
        flash('Você não pode deletar a própria conta de administrador.', 'danger')
        return redirect(url_for('admin.gerenciar_usuarios'))
        
    db.session.delete(user)
    db.session.commit()
    flash('Usuário deletado com sucesso.', 'success')
    return redirect(url_for('admin.gerenciar_usuarios'))
