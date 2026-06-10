#!/usr/bin/env bash
# Encerra o script caso ocorra algum erro
set -o errexit

echo "Instalando dependências..."
pip install -r requirements.txt

echo "Coletando arquivos estáticos..."
python manage.py collectstatic --no-input

echo "Rodando migrações no banco de dados..."
python manage.py migrate

echo "Sincronizando dados da Copa..."
python manage.py sync_copa

echo "Criando superusuário (se as variáveis de ambiente existirem)..."
# O '|| true' evita que o script quebre se o usuário já existir em deploys futuros
python manage.py createsuperuser --noinput || true