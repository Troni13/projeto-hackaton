from app import create_app
from extensions import db
from sqlalchemy import text

app = create_app()
with app.app_context():
    try:
        db.session.execute(text("ALTER TABLE chamado DROP COLUMN data_conclusao"))
        db.session.commit()
        print("Coluna data_conclusao removida com sucesso!")
    except Exception as e:
        print(f"Erro ao remover coluna: {e}")
