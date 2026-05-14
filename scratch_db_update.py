from app import create_app
from extensions import db
from sqlalchemy import text

app = create_app()
with app.app_context():
    try:
        # Tentar verificar se a coluna existe
        db.session.execute(text("SELECT data_conclusao FROM chamado LIMIT 1"))
        print("Coluna data_conclusao já existe.")
    except Exception as e:
        print(f"Coluna data_conclusao não encontrada ou erro: {e}")
        print("Tentando adicionar a coluna...")
        try:
            db.session.execute(text("ALTER TABLE chamado ADD COLUMN data_conclusao DATETIME NULL"))
            db.session.commit()
            print("Coluna data_conclusao adicionada com sucesso!")
        except Exception as e2:
            print(f"Erro ao adicionar coluna: {e2}")
