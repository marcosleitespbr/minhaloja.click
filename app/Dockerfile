FROM python:3.11-slim

WORKDIR /app

# Copia os requisitos para aproveitar o cache de camadas do Docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante dos arquivos do projeto
COPY . .

# Expõe a porta padrão do FastAPI
EXPOSE 8000

# Comando para rodar a API com Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]