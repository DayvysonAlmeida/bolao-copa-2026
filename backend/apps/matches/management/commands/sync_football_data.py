"""
Comando para sincronizar os jogos da Copa do Mundo 2026 via football-data.org.

API: https://api.football-data.org/v4/competitions/WC/matches

Uso:
    python manage.py sync_football_data

O comando:
  1. Busca os jogos usando a FOOTBALL_DATA_API_KEY
  2. Traduz os nomes das seleções para PT-br
  3. Atualiza os placares e status no banco sem criar novos dados.
"""

import os
import requests
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from apps.matches.models import Team, Match

# Dicionário de Tradução: Inglês da API -> Português (Padrão IBGE/Fifa pt-br)
TEAM_TRANSLATIONS = {
    "Argentina": "Argentina", "Brazil": "Brasil", "Colombia": "Colômbia", 
    "Ecuador": "Equador", "Paraguay": "Paraguai", "Uruguay": "Uruguai",
    "Canada": "Canadá", "Costa Rica": "Costa Rica", "Cuba": "Cuba", 
    "El Salvador": "El Salvador", "Haiti": "Haiti", "Honduras": "Honduras", 
    "Jamaica": "Jamaica", "Mexico": "México", "Panama": "Panamá", 
    "United States": "Estados Unidos", "Algeria": "Argélia", "Cameroon": "Camarões",
    "Democratic Republic of the Congo": "República Democrática do Congo",
    "DR Congo": "República Democrática do Congo", "Congo DR": "República Democrática do Congo",
    "Egypt": "Egito", "Ghana": "Gana", 
    "Ivory Coast": "Costa do Marfim", "Cote d'Ivoire": "Costa do Marfim", "Morocco": "Marrocos", "Nigeria": "Nigéria", 
    "Senegal": "Senegal", "South Africa": "África do Sul", "Tunisia": "Tunísia",
    "Australia": "Austrália", "Iran": "Irã", "Iraq": "Iraque", "Japan": "Japão", 
    "Jordan": "Jordânia", "Qatar": "Catar", "Saudi Arabia": "Arábia Saudita", 
    "South Korea": "Coreia do Sul", "Korea Republic": "Coreia do Sul", "Uzbekistan": "Uzbequistão", "Austria": "Áustria", 
    "Belgium": "Bélgica", "Bosnia and Herzegovina": "Bósnia e Herzegovina", "Bosnia-Herzegovina": "Bósnia e Herzegovina",
    "Croatia": "Croácia", "Czechia": "República Tcheca", "Czech Republic": "República Tcheca", "Denmark": "Dinamarca", 
    "England": "Inglaterra", "France": "França", "Germany": "Alemanha", 
    "Greece": "Grécia", "Hungary": "Hungria", "Italy": "Itália", "Netherlands": "Holanda", 
    "Norway": "Noruega", "Poland": "Polônia", "Portugal": "Portugal", "Romania": "Romênia", 
    "Scotland": "Escócia", "Serbia": "Sérvia", "Slovakia": "Eslováquia", 
    "Slovenia": "Eslovênia", "Spain": "Espanha", "Sweden": "Suécia", "Switzerland": "Suíça", 
    "Turkey": "Turquia", "Turkiye": "Turquia", "Ukraine": "Ucrânia", "Wales": "País de Gales", 
    "New Zealand": "Nova Zelândia", "Curaçao": "Curaçau", "Curacao": "Curaçau", "Cape Verde": "Cabo Verde", "Cape Verde Islands": "Cabo Verde"
}

def translate_team(name_en):
    return TEAM_TRANSLATIONS.get(name_en, name_en)

STATUS_MAP = {
    "SCHEDULED": "PENDING",
    "TIMED": "PENDING",
    "IN_PLAY": "IN_PROGRESS",
    "PAUSED": "IN_PROGRESS",
    "FINISHED": "FINISHED",
    "SUSPENDED": "PENDING",
    "POSTPONED": "PENDING",
    "CANCELLED": "PENDING",
    "AWARDED": "FINISHED"
}

# NOVO: Mapeamento de fases da API para nosso campo phase
STAGE_MAP = {
    "GROUP_STAGE": "GROUP_STAGE",
    "LAST_16": "ROUND_16",
    "QUARTER_FINALS": "QUARTER_FINALS",
    "SEMI_FINALS": "SEMI_FINALS",
    "THIRD_PLACE": "THIRD_PLACE",
    "FINAL": "FINAL",
}

class Command(BaseCommand):
    help = "Sincroniza jogos via football-data.org atualizando apenas placares."

    def handle(self, *args, **options):
        # Tenta pegar a chave do settings, senão pega do env
        api_key = getattr(settings, 'FOOTBALL_DATA_API_KEY', os.environ.get('FOOTBALL_DATA_API_KEY'))
        
        if not api_key:
            raise CommandError("A chave da API FOOTBALL_DATA_API_KEY não foi encontrada. Configure-a no .env ou no settings.py")

        url = "https://api.football-data.org/v4/competitions/WC/matches"
        headers = {
            "X-Auth-Token": api_key
        }

        self.stdout.write(self.style.HTTP_INFO(f"[INFO] Buscando jogos em {url} ...\n"))
        
        try:
            response = requests.get(url, headers=headers, timeout=15)
            if response.status_code != 200:
                self.stdout.write(self.style.ERROR(f"Erro da API (Status {response.status_code}): {response.text}"))
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException as e:
            raise CommandError(f"Erro de conexão ao buscar jogos: {e}")

        matches_data = data.get("matches", [])
        self.stdout.write(self.style.SUCCESS(f"[SUCESSO] {len(matches_data)} jogos retornados pela API.\n"))

        jogos_atualizados = 0
        jogos_nao_encontrados = 0
        teve_jogo_finalizado_agora = False

        for m in matches_data:
            if not m.get("homeTeam") or not m.get("awayTeam") or not m["homeTeam"].get("name") or not m["awayTeam"].get("name"):
                continue

            home_en = m["homeTeam"]["name"]
            away_en = m["awayTeam"]["name"]

            home_ptbr = translate_team(home_en)
            away_ptbr = translate_team(away_en)

            api_status = m.get("status", "SCHEDULED")
            status = STATUS_MAP.get(api_status, "PENDING")

            # NOVO: Extrair fase do jogo da API
            api_stage = m.get("stage", "GROUP_STAGE")
            phase = STAGE_MAP.get(api_stage, api_stage)

            score = m.get("score", {})
            full_time = score.get("fullTime", {})
            home_score = full_time.get("home") if full_time else None
            away_score = full_time.get("away") if full_time else None

            # NOVO: Extrair vencedor dos pênaltis (se aplicável)
            penalties = score.get("penalties", {})
            pen_home = penalties.get("home") if penalties else None
            pen_away = penalties.get("away") if penalties else None
            
            # Pega a data/hora oficial da API
            from django.utils.dateparse import parse_datetime
            utc_date_str = m.get("utcDate")
            api_match_date = parse_datetime(utc_date_str) if utc_date_str else None

            match_qs = Match.objects.filter(home_team__name=home_ptbr, away_team__name=away_ptbr)
            
            if match_qs.exists():
                match_obj = match_qs.first()
                
                if match_obj.status != 'FINISHED' and status == 'FINISHED':
                    teve_jogo_finalizado_agora = True
                
                if api_status in ["IN_PLAY", "PAUSED", "FINISHED", "AWARDED"]:
                    if home_score is not None and away_score is not None:
                        match_obj.home_score = home_score
                        match_obj.away_score = away_score
                
                match_obj.status = status

                # NOVO: Atualizar phase (aditivo)
                if phase:
                    match_obj.phase = phase

                # NOVO: Atualizar penalty_winner se houve pênaltis
                if pen_home is not None and pen_away is not None and pen_home != pen_away:
                    try:
                        if pen_home > pen_away:
                            match_obj.penalty_winner = match_obj.home_team
                        else:
                            match_obj.penalty_winner = match_obj.away_team
                    except Exception:
                        pass  # Não quebra o sync se der erro
                
                horario_atualizado = False
                if api_match_date and match_obj.match_date != api_match_date:
                    match_obj.match_date = api_match_date
                    horario_atualizado = True
                
                match_obj.save() # Dispara cálculo de pontos do modelo Match
                
                jogos_atualizados += 1
                
                msg = f"  [ATUALIZADO] Atualizado: {home_ptbr} x {away_ptbr} -> Status: {status} Placar: {home_score}x{away_score}"
                if phase != 'GROUP_STAGE':
                    msg += f" | Fase: {phase}"
                if match_obj.penalty_winner:
                    msg += f" | Pênaltis: {match_obj.penalty_winner.name}"
                if horario_atualizado:
                    msg += f" | [TEMPO] Horário ajustado!"
                
                self.stdout.write(msg)
            else:
                jogos_nao_encontrados += 1
                self.stdout.write(self.style.WARNING(f"  [AVISO] Não encontrado no banco: {home_en} ({home_ptbr}) x {away_en} ({away_ptbr})"))

        if teve_jogo_finalizado_agora:
            from apps.bets.utils import update_ranking_positions
            self.stdout.write(self.style.HTTP_INFO("[INFO] Atualizando histórico de posições do ranking..."))
            update_ranking_positions()

        self.stdout.write(self.style.SUCCESS("=" * 52))
        self.stdout.write(self.style.SUCCESS("[SUCESSO] Sincronização football-data.org finalizada!"))
        self.stdout.write(f"   Jogos atualizados:       {jogos_atualizados}")
        self.stdout.write(f"   Jogos não encontrados:   {jogos_nao_encontrados} (Ignorados para manter integridade)")
        self.stdout.write(self.style.SUCCESS("=" * 52))
