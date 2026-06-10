#!/usr/bin/env bash
# Encerra o script caso ocorra algum erro
set -o errexit

echo "Instalando dependências..."
pip install -r requirements.txt

echo "Coletando arquivos estáticos..."
python manage.py collectstatic --no-input

echo "Rodando migrações no banco de dados..."
python manage.py migrate