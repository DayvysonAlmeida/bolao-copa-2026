#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Instalando dependencias..."
pip install -r requirements.txt

echo "Coletando arquivos estaticos..."
python manage.py collectstatic --no-input

echo "Aplicando migrações do banco de dados..."
python manage.py migrate

# Se você quiser rodar o script de sincronizar dados da copa automaticamente, pode descomentar a linha abaixo
# python manage.py sync_copa
