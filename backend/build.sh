#!/usr/bin/env bash
# Encerra o script caso ocorra algum erro
set -o errexit

echo "Instalando dependências..."
pip install -r requirements.txt

echo "Coletando arquivos estáticos..."
python manage.py collectstatic --no-input

echo "Limpando e mesclando seleções duplicadas pela API..."
python manage.py fix_worldcup_names

echo "Executando setup do banco de dados (Migrações, Dados e Admin)..."
python manage.py setup_deploy

echo "Configurando o Bolão da Copa (Mata-Mata)..."
python manage.py setup_bolao_matamata
python manage.py setup_knockout_bracket
