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
from django.utils.dateparse import parse_datetime
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
    "LAST_32": "ROUND_32",
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
            duration = score.get("duration", "REGULAR")

            if duration == "PENALTY_SHOOTOUT":
                # Evita pegar o placar de pênaltis que algumas APIs enviam no fullTime
                reg_time = score.get("regularTime", {})
                ext_time = score.get("extraTime", {})
                if reg_time and ext_time and reg_time.get("home") is not None and ext_time.get("home") is not None:
                    home_score = reg_time.get("home", 0) + ext_time.get("home", 0)
                    away_score = reg_time.get("away", 0) + ext_time.get("away", 0)
                else:
                    home_score = reg_time.get("home") if reg_time else full_time.get("home")
                    away_score = reg_time.get("away") if reg_time else full_time.get("away")
            else:
                home_score = full_time.get("home") if full_time else None
                away_score = full_time.get("away") if full_time else None

            # NOVO: Extrair vencedor dos pênaltis (se aplicável)
            penalties = score.get("penalties", {})
            pen_home = penalties.get("home") if penalties else None
            pen_away = penalties.get("away") if penalties else None
            
            # Pega a data/hora oficial da API
            utc_date_str = m.get("utcDate")
            api_match_date = parse_datetime(utc_date_str) if utc_date_str else None

            is_knockout = phase in ["ROUND_32", "ROUND_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"]

            if is_knockout:
                match_qs = Match.objects.filter(bolao__scoring_mode='KNOCKOUT', home_team__name=home_ptbr, away_team__name=away_ptbr)
                if not match_qs.exists() and api_match_date:
                    match_qs = Match.objects.filter(bolao__scoring_mode='KNOCKOUT', match_date=api_match_date)
            else:
                match_qs = Match.objects.filter(home_team__name=home_ptbr, away_team__name=away_ptbr)
            
            if match_qs.exists():
                for match_obj in match_qs:
                    # Se for Mata-Mata, atualiza os times para substituir os placeholders (ex: "W74") pelos times reais da API
                    if is_knockout:
                        team_home, _ = Team.objects.get_or_create(name=home_ptbr, defaults={'group': '-'})
                        team_away, _ = Team.objects.get_or_create(name=away_ptbr, defaults={'group': '-'})
                        match_obj.home_team = team_home
                        match_obj.away_team = team_away

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
                    if pen_home is not None and pen_away is not None:
                        match_obj.home_penalty_score = pen_home
                        match_obj.away_penalty_score = pen_away
                        if pen_home != pen_away:
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
                    
                    # LOGICA DE AVANÇO DE FASE (Mata-Mata)
                    if match_obj.status == 'FINISHED' and is_knockout and match_obj.match_number:
                        winner = None
                        if match_obj.penalty_winner:
                            winner = match_obj.penalty_winner
                        elif match_obj.home_score is not None and match_obj.away_score is not None:
                            if match_obj.home_score > match_obj.away_score:
                                winner = match_obj.home_team
                            elif match_obj.away_score > match_obj.home_score:
                                winner = match_obj.away_team
                        
                        if winner:
                            placeholder_w = f"W{match_obj.match_number}"
                            Match.objects.filter(home_team__name=placeholder_w, bolao=match_obj.bolao).update(home_team=winner)
                            Match.objects.filter(away_team__name=placeholder_w, bolao=match_obj.bolao).update(away_team=winner)
                            
                            loser = match_obj.away_team if winner == match_obj.home_team else match_obj.home_team
                            placeholder_l = f"RU{match_obj.match_number}"
                            Match.objects.filter(home_team__name=placeholder_l, bolao=match_obj.bolao).update(home_team=loser)
                            Match.objects.filter(away_team__name=placeholder_l, bolao=match_obj.bolao).update(away_team=loser)

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
