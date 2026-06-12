import requests
import os

API_KEY = os.environ.get('API_SPORTS_KEY', '')
print(f"Chave encontrada: {API_KEY[:8]}..." if API_KEY else "CHAVE NÃO ENCONTRADA!")

# Testa endpoint /status (não consome cota)
url = 'https://v3.football.api-sports.io/status'
headers = {'x-apisports-key': API_KEY}

print("\n--- Testando api-sports.io ---")
r = requests.get(url, headers=headers, timeout=10)
print(f"Status HTTP: {r.status_code}")
print(f"Resposta: {r.text[:600]}")
