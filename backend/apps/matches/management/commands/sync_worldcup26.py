"""
Comando para sincronizar os jogos da Copa do Mundo 2026 via worldcup26.ir.

API 100% GRATUITA, sem autenticação, open source!
Documentação: https://worldcup26.ir/api-docs

Uso:
    python manage.py sync_worldcup26

Endpoints usados:
    GET https://worldcup26.ir/get/games   → todos os 104 jogos
    GET https://worldcup26.ir/get/teams   → 48 seleções com bandeiras

O comando:
  1. Busca os times (com nome e URL da bandeira)
  2. Busca todos os jogos
  3. Cria/atualiza Teams e Matches no banco
  4. Mapeia os status: finished/notstarted/in_progress → FINISHED/PENDING/IN_PROGRESS
"""

import requests
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from django.core.management.base import BaseCommand, CommandError
from apps.matches.models import Team, Match

# Fuso horário de Brasília para converter os horários locais da API
TIMEZONE_BRASILIA = ZoneInfo("America/Sao_Paulo")

# URL base da API
BASE_URL = "https://worldcup26.ir/get"

# Mapeamento de status da API → status interno
STATUS_MAP = {
    "finished":   "FINISHED",
    "notstarted": "PENDING",
    "in_progress": "IN_PROGRESS",
    "halftime":   "IN_PROGRESS",
}

# Fases eliminatórias mapeadas para label amigável (grupo = código da fase)
PHASE_LABELS = {
    "R32": "Oitavas de Final",
    "R16": "Oitavas de Final",
    "QF":  "Quartas de Final",
    "SF":  "Semifinal",
    "3RD": "3º Lugar",
    "FINAL": "Final",
}

# Dicionário de Tradução: Inglês da API -> Português (Padrão IBGE/Fifa pt-br)
TEAM_TRANSLATIONS = {
    "Argentina": "Argentina", "Brazil": "Brasil", "Colombia": "Colômbia", 
    "Ecuador": "Equador", "Paraguay": "Paraguai", "Uruguay": "Uruguai",
    "Canada": "Canadá", "Costa Rica": "Costa Rica", "Cuba": "Cuba", 
    "El Salvador": "El Salvador", "Haiti": "Haiti", "Honduras": "Honduras", 
    "Jamaica": "Jamaica", "Mexico": "México", "Panama": "Panamá", 
    "United States": "Estados Unidos", "Algeria": "Argélia", "Cameroon": "Camarões",
    "Democratic Republic of the Congo": "RD Congo", "Egypt": "Egito", "Ghana": "Gana", 
    "Ivory Coast": "Costa do Marfim", "Morocco": "Marrocos", "Nigeria": "Nigéria", 
    "Senegal": "Senegal", "South Africa": "África do Sul", "Tunisia": "Tunísia",
    "Australia": "Austrália", "Iran": "Irã", "Iraq": "Iraque", "Japan": "Japão", 
    "Jordan": "Jordânia", "Qatar": "Catar", "Saudi Arabia": "Arábia Saudita", 
    "South Korea": "Coreia do Sul", "Uzbekistan": "Uzbequistão", "Austria": "Áustria", 
    "Belgium": "Bélgica", "Bosnia and Herzegovina": "Bósnia e Herzegovina", 
    "Croatia": "Croácia", "Czech Republic": "República Checa", "Denmark": "Dinamarca", 
    "England": "Inglaterra", "France": "França", "Germany": "Alemanha", 
    "Greece": "Grécia", "Hungary": "Hungria", "Italy": "Itália", "Netherlands": "Holanda", 
    "Norway": "Noruega", "Poland": "Polônia", "Portugal": "Portugal", "Romania": "Romênia", 
    "Scotland": "Escócia", "Serbia": "Sérvia", "Slovakia": "Eslováquia", 
    "Slovenia": "Eslovênia", "Spain": "Espanha", "Sweden": "Suécia", "Switzerland": "Suíça", 
    "Turkey": "Turquia", "Ukraine": "Ucrânia", "Wales": "País de Gales", 
    "New Zealand": "Nova Zelândia", "Curaçao": "Curaçao", "Cape Verde": "Cabo Verde"
}

def translate_team(name_en):
    return TEAM_TRANSLATIONS.get(name_en, name_en)


class Command(BaseCommand):
    help = "Sincroniza jogos da Copa do Mundo 2026 via worldcup26.ir (gratuito, sem chave)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Apenas exibe os dados sem salvar no banco",
        )
        parser.add_argument(
            "--only-finished",
            action="store_true",
            default=False,
            help="Atualiza apenas jogos já finalizados (mais rápido)",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        only_finished = options["only_finished"]

        self.stdout.write(self.style.HTTP_INFO(
            "\n🌍 Sincronizando Copa do Mundo 2026 via worldcup26.ir...\n"
        ))
        if dry_run:
            self.stdout.write(self.style.WARNING("⚠️  DRY-RUN: nenhum dado será salvo.\n"))

        # ── 1. Busca times (com bandeiras) ───────────────────────────────────
        self.stdout.write("📡 Buscando seleções...")
        try:
            teams_resp = requests.get(f"{BASE_URL}/teams", timeout=15)
            teams_resp.raise_for_status()
            teams_data = teams_resp.json().get("teams", [])
        except requests.exceptions.RequestException as e:
            raise CommandError(f"Erro ao buscar times: {e}")

        # Monta dicionário id → dados do time
        teams_by_id = {}
        for t in teams_data:
            name_en = t.get("name_en") or t.get("name", "")
            teams_by_id[str(t.get("id", ""))] = {
                "name":  translate_team(name_en),
                "flag":  t.get("flag", ""),
                "group": t.get("group", "Z"),
            }

        self.stdout.write(self.style.SUCCESS(f"✅ {len(teams_by_id)} seleções encontradas.\n"))

        # ── 2. Busca jogos ────────────────────────────────────────────────────
        self.stdout.write("📡 Buscando jogos...")
        try:
            games_resp = requests.get(f"{BASE_URL}/games", timeout=15)
            games_resp.raise_for_status()
            games_data = games_resp.json().get("games", [])
        except requests.exceptions.RequestException as e:
            raise CommandError(f"Erro ao buscar jogos: {e}")

        self.stdout.write(self.style.SUCCESS(f"✅ {len(games_data)} jogos encontrados!\n"))

        # ── 3. Processa cada jogo ─────────────────────────────────────────────
        times_criados = times_atualizados = 0
        jogos_criados = jogos_atualizados = jogos_ignorados = 0

        for jogo in games_data:
            home_id = str(jogo.get("home_team_id", "0"))
            away_id = str(jogo.get("away_team_id", "0"))
            jogo_tipo = jogo.get("type", "group")

            # Jogos de fase eliminatória sem times definidos ainda
            if home_id == "0" or away_id == "0":
                phase = jogo.get("group", "?")
                label = PHASE_LABELS.get(phase, phase)
                home_label = jogo.get("home_team_label", "A definir")
                away_label = jogo.get("away_team_label", "A definir")
                self.stdout.write(f"  ⏭ [{label}] {home_label} × {away_label} — times ainda indefinidos, ignorando.")
                jogos_ignorados += 1
                continue

            # Recupera dados dos times
            home_info = teams_by_id.get(home_id) or {
                "name": translate_team(jogo.get("home_team_name_en", f"Time {home_id}")),
                "flag": "",
                "group": jogo.get("group", "Z"),
            }
            away_info = teams_by_id.get(away_id) or {
                "name": translate_team(jogo.get("away_team_name_en", f"Time {away_id}")),
                "flag": "",
                "group": jogo.get("group", "Z"),
            }

            # Grupo (apenas para fase de grupos; eliminatórias usam código da fase)
            grupo_raw = jogo.get("group", "Z")
            grupo = grupo_raw if len(grupo_raw) == 1 else "Z"  # ex: "A", "B"... ou "R32"

            # Status
            time_elapsed = jogo.get("time_elapsed", "notstarted").lower()
            finished_flag = str(jogo.get("finished", "FALSE")).upper() == "TRUE"
            if finished_flag:
                status = "FINISHED"
            else:
                status = STATUS_MAP.get(time_elapsed, "PENDING")

            # Filtra se só quer finalizados
            if only_finished and status != "FINISHED":
                continue

            # Placar (Sempre pega se estiver finalizado, no intervalo ou em andamento)
            try:
                if status in ["FINISHED", "IN_PROGRESS"]:
                    home_score = int(jogo.get("home_score", 0))
                    away_score = int(jogo.get("away_score", 0))
                else:
                    home_score = away_score = None
            except (TypeError, ValueError):
                home_score = away_score = None

            # Data — a API retorna no formato "MM/DD/YYYY HH:MM" em horário de Brasília
            date_str = jogo.get("local_date", "")
            try:
                naive_dt = datetime.strptime(date_str, "%m/%d/%Y %H:%M")
                match_date = naive_dt.replace(tzinfo=TIMEZONE_BRASILIA)
            except (ValueError, TypeError):
                self.stdout.write(self.style.WARNING(f"  ⚠️  Data inválida: '{date_str}', ignorando."))
                jogos_ignorados += 1
                continue

            if dry_run:
                self.stdout.write(
                    f"  [DRY] {home_info['name']} × {away_info['name']} | "
                    f"{match_date.strftime('%d/%m/%Y %H:%M')} | {status} | "
                    f"Placar: {home_score}-{away_score} | Grupo: {grupo_raw}"
                )
                continue

            # ── Cria/atualiza time da casa ────────────────────────────────────
            team_home, created = Team.objects.update_or_create(
                name=home_info["name"],
                defaults={"group": grupo, "flag_url": home_info["flag"]},
            )
            times_criados += created
            times_atualizados += not created

            # ── Cria/atualiza time visitante ──────────────────────────────────
            team_away, created = Team.objects.update_or_create(
                name=away_info["name"],
                defaults={"group": grupo, "flag_url": away_info["flag"]},
            )
            times_criados += created
            times_atualizados += not created

            # ── Cria/atualiza partida ─────────────────────────────────────────
            match, created = Match.objects.update_or_create(
                home_team=team_home,
                away_team=team_away,
                defaults={
                    "match_date": match_date,
                    "home_score": home_score,
                    "away_score": away_score,
                    "status": status,
                },
            )
            # Aciona cálculo de pontos do bolão
            match.save()

            if created:
                jogos_criados += 1
                self.stdout.write(
                    f"  ✨ Criado: {home_info['name']} × {away_info['name']} "
                    f"({match_date.strftime('%d/%m/%Y %H:%M')}) [{status}]"
                )
            else:
                jogos_atualizados += 1
                score_str = f"{home_score}-{away_score}" if home_score is not None else "s/placar"
                self.stdout.write(
                    f"  🔄 Atualizado: {home_info['name']} × {away_info['name']} → {status} ({score_str})"
                )

        # ── 4. Resumo ─────────────────────────────────────────────────────────
        if not dry_run:
            self.stdout.write("")
            self.stdout.write(self.style.SUCCESS("═" * 52))
            self.stdout.write(self.style.SUCCESS("✅ Sincronização concluída!"))
            self.stdout.write(f"   Times criados:     {times_criados}")
            self.stdout.write(f"   Times atualizados: {times_atualizados}")
            self.stdout.write(f"   Jogos criados:     {jogos_criados}")
            self.stdout.write(f"   Jogos atualizados: {jogos_atualizados}")
            if jogos_ignorados:
                self.stdout.write(self.style.WARNING(f"   Jogos ignorados:   {jogos_ignorados} (fases elimin. sem times definidos)"))
            self.stdout.write(self.style.SUCCESS("═" * 52))
