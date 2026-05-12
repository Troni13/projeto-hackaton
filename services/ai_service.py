import os
import json
import google.generativeai as genai

def analisar_anuncio(titulo, conteudo):
    """
    Analisa o anúncio usando IA para moderação e categorização.
    Retorna um dicionário:
    {
        "status": "aprovado" ou "rejeitado",
        "motivo": "motivo da rejeição se houver",
        "tags": ["Tag1", "Tag2"]
    }
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        # Se não houver chave, aprova sem tags para não travar o sistema
        return {"status": "aprovado", "motivo": "", "tags": []}

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-flash-latest')
        
        prompt = f"""Você é um moderador de um mural da comunidade de uma instituição de ensino.
Sua tarefa é analisar o título e o conteúdo de um anúncio que será publicado no mural.
1. MODERAÇÃO: O conteúdo deve ser respeitoso. Rejeite se contiver discurso de ódio, xingamentos, preconceito, assédio, spam agressivo ou for inapropriado para um ambiente escolar.
2. CATEGORIZAÇÃO: Gere de 1 a 3 tags curtas que descrevam o tema do anúncio (ex: Eventos, Achados e Perdidos, Avisos, Estágio, Ajuda, etc).

Retorne SUA RESPOSTA EXCLUSIVAMENTE NO FORMATO JSON ABAIXO, sem nenhuma formatação markdown:
{{
    "status": "aprovado" ou "rejeitado",
    "motivo": "Se rejeitado, explique o porquê. Se aprovado, deixe vazio.",
    "tags": ["Tag1", "Tag2"]
}}

Título do Anúncio: {titulo}
Conteúdo do Anúncio: {conteudo}
"""
        response = model.generate_content(prompt)
        texto_limpo = response.text.replace('```json', '').replace('```', '').strip()
        resultado = json.loads(texto_limpo)
        
        # Garante a formatação mínima esperada
        if 'status' not in resultado:
            resultado['status'] = 'aprovado'
        if 'tags' not in resultado:
            resultado['tags'] = []
            
        return resultado
    except Exception as e:
        print(f"Erro na IA de moderação: {e}")
        # Em caso de erro na IA (ex: quota excedida, erro de formato), aprova por padrão
        return {"status": "aprovado", "motivo": "", "tags": []}
