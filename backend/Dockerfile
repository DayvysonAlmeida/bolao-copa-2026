# Usa uma imagem oficial do Python, leve e rápida
FROM python:3.11-slim

# Impede o Python de gravar arquivos .pyc e força o log direto no terminal
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Define a pasta de trabalho dentro do contêiner
WORKDIR /app

# Copia o arquivo de dependências e instala tudo
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante do código do projeto para dentro do contêiner
COPY . /app/