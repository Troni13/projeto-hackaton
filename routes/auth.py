from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash
from models import User
from extensions import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.painel'))

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        user = User.query.filter_by(username=username).first()

        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('main.painel'))
        else:
            flash('Usuário ou senha inválidos.', 'danger')

    return render_template('login.html')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.painel'))

    if request.method == 'POST':
        nome_completo = request.form.get('nome_completo')
        username = request.form.get('username')
        password = request.form.get('password')

        user = User.query.filter_by(username=username).first()

        if user:
            flash('Nome de usuário já existe.', 'danger')
            return redirect(url_for('auth.register'))

        # Todo novo usuário criado pela tela de registro é 'aluno' (Utilizador) por padrão
        new_user = User(nome_completo=nome_completo, username=username, role='aluno', setor=None)
        new_user.set_password(password)

        db.session.add(new_user)
        db.session.commit()

        flash('Registro realizado com sucesso! Faça login.', 'success')
        return redirect(url_for('auth.login'))

    return render_template('register.html')

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))
