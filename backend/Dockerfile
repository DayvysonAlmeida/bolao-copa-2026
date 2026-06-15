# Usa uma imagem oficial do Python, leve e rápida
FROM python:3.11-slim-bookworm

# Impede o Python de gravar arquivos .pyc e força o log direto no terminal
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Define a pasta de trabalho dentro do contêiner
WORKDIR /app

# Nenhuma dependência de sistema adicional é necessária pois o pymysql é Python puro

# Copia o arquivo de dependências e instala tudo
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante do código do projeto para dentro do contêiner
COPY . /app/

# Expõe a porta que o Gunicorn vai rodar
EXPOSE 8000

# Executa migrações e coleta estáticos na inicialização e então inicia o servidor Gunicorn
CMD bash -c "python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn core.wsgi:application --bind 0.0.0.0:${PORT:-8000}"