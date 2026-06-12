"""
Comando para sincronizar os jogos da Copa do Mundo 2026 via API-Sports.

Uso:
    python manage.py sync_api_sports --key SUA_CHAVE_AQUI

Ou defina a variável de ambiente API_SPORTS_KEY no .env / docker-compose.

O comando:
  1. Busca todos os jogos da liga 1 (FIFA World Cup) temporada 2026
  2. Cria ou atualiza os Times (Team) no banco
  3. Cria ou atualiza as Partidas (Match) no banco
  4. Mapeia os status da API para os status do sistema (PENDING/IN_PROGRESS/FINISHED)
"""

import os
import requests
from datetime import datetime, timezone

from django.core.management.base import BaseCommand, CommandError
from django.utils.dateparse import parse_datetime

from apps.matches.models import Team, Match


# ── Mapeamento de status da API-Sports → status interno ──────────────────────
# Referência: https://www.api-football.com/documentation-v3#tag/Fixtures/operation/get-fixtures
STATUS_MAP = {
    # Não iniciado
    'TBD':  'PENDING',   # Time to be defined
    'NS':   'PENDING',   # Not started
    # Em andamento
    '1H':   'IN_PROGRESS',  # First half
    'HT':   'IN_PROGRESS',  # Half time
    '2H':   'IN_PROGRESS',  # Second half
    'ET':   'IN_PROGRESS',  # Extra time
    'BT':   'IN_PROGRESS',  # Break time
    'P':    'IN_PROGRESS',  # Penalty in progress
    'SUSP': 'IN_PROGRESS',  # Suspended
    'INT':  'IN_PROGRESS',  # Interrupted
    'LIVE': 'IN_PROGRESS',  # In play
    # Finalizados
    'FT':   'FINISHED',  # Match finished
    'AET':  'FINISHED',  # After extra time
    'PEN':  'FINISHED',  # After penalties
    'AWD':  'FINISHED',  # Technical loss (awarded)
    'WO':   'FINISHED',  # Walkover
    # Cancelados/Adiados → trata como pendente
    'PST':  'PENDING',   # Postponed
    'CANC': 'PENDING',   # Cancelled
    'ABD':  'PENDING',   # Abandoned
}

# ── Mapeamento de grupo via nome da rodada da API ────────────────────────────
# A API retorna "Group A - Matchday 1", etc.
def extrair_grupo(round_str: str) -> str:
    """Extrai a letra do grupo a partir da string de rodada da API."""
    if not round_str:
        return ''
    # Ex: "Group A - Matchday 1" → "A"
    import re
    match = re.search(r'Group\s+([A-Z])', round_str, re.IGNORECASE)
    if match:
        return match.group(1).upper()
    # Fases eliminatórias não têm grupo
    return ''


class Command(BaseCommand):
    help = 'Sincroniza jogos da Copa do Mundo 2026 via API-Sports (api-football.com)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--key',
            type=str,
            default=None,
            help='Chave da API-Sports (ou defina API_SPORTS_KEY no ambiente)',
        )
        parser.add_argument(
            '--league',
            type=str,
            default='1',
            help='ID da liga na API-Sports (padrão: 1 = FIFA World Cup)',
        )
        parser.add_argument(
            '--season',
            type=str,
            default='2026',
            help='Temporada (padrão: 2026)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            default=False,
            help='Apenas exibe os dados sem salvar no banco',
        )

    def handle(self, *args, **options):
        # ── 1. Obtém a chave da API ───────────────────────────────────────────
        api_key = options['key'] or os.environ.get('API_SPORTS_KEY', '')
        if not api_key:
            raise CommandError(
                'Chave da API não encontrada! Use --key SUA_CHAVE ou defina '
                'a variável de ambiente API_SPORTS_KEY.'
            )

        league_id = options['league']
        season = options['season']
        dry_run = options['dry_run']

        self.stdout.write(
            self.style.HTTP_INFO(
                f'\n🔄 Sincronizando Copa do Mundo {season} (Liga {league_id}) via API-Sports...\n'
            )
        )
        if dry_run:
            self.stdout.write(self.style.WARNING('⚠️  DRY-RUN: nenhum dado será salvo.\n'))

        # ── 2. Chama a API-Sports ─────────────────────────────────────────────
        url = 'https://v3.football.api-sports.io/fixtures'
        headers = {'x-apisports-key': api_key}
        params = {'league': league_id, 'season': season}

        try:
            self.stdout.write('📡 Consultando API-Sports...')
            response = requests.get(url, headers=headers, params=params, timeout=30)
            response.raise_for_status()
        except requests.exceptions.Timeout:
            raise CommandError('Timeout ao conectar com a API-Sports.')
        except requests.exceptions.RequestException as e:
            raise CommandError(f'Erro na requisição: {e}')

        dados = response.json()

        # Verifica erros retornados pela API
        errors = dados.get('errors', {})
        if errors:
            raise CommandError(f'Erro da API-Sports: {errors}')

        jogos = dados.get('response', [])
        if not jogos:
            self.stdout.write(self.style.WARNING(
                f'Nenhum jogo encontrado para liga={league_id}, season={season}.\n'
                'Verifique se a temporada já está disponível na API.'
            ))
            return

        self.stdout.write(self.style.SUCCESS(f'✅ {len(jogos)} jogos encontrados na API!\n'))

        # ── 3. Processa cada jogo ─────────────────────────────────────────────
        times_criados = 0
        times_atualizados = 0
        jogos_criados = 0
        jogos_atualizados = 0
        jogos_ignorados = 0

        for jogo in jogos:
            fixture = jogo.get('fixture', {})
            teams   = jogo.get('teams', {})
            goals   = jogo.get('goals', {})
            league  = jogo.get('league', {})

            # Dados dos times
            home_name  = teams.get('home', {}).get('name', '')
            home_flag  = teams.get('home', {}).get('logo', '')
            away_name  = teams.get('away', {}).get('name', '')
            away_flag  = teams.get('away', {}).get('logo', '')

            if not home_name or not away_name:
                jogos_ignorados += 1
                continue

            # Data do jogo (vem em ISO 8601 com timezone)
            date_str = fixture.get('date', '')
            match_date = parse_datetime(date_str) if date_str else None
            if not match_date:
                self.stdout.write(self.style.WARNING(f'  ⚠️  Data inválida para {home_name} x {away_name}, ignorando.'))
                jogos_ignorados += 1
                continue

            # Status
            status_short = fixture.get('status', {}).get('short', 'NS')
            status = STATUS_MAP.get(status_short, 'PENDING')

            # Placar
            home_score = goals.get('home')   # None se não iniciou
            away_score = goals.get('away')

            # Grupo
            round_str = league.get('round', '')
            grupo = extrair_grupo(round_str)

            if dry_run:
                self.stdout.write(
                    f'  [DRY] {home_name} x {away_name} | {match_date} | {status} | '
                    f'Placar: {home_score}-{away_score} | Grupo: {grupo or "Fase Final"}'
                )
                continue

            # ── Cria/atualiza Time da Casa ────────────────────────────────────
            team_home, created = Team.objects.update_or_create(
                name=home_name,
                defaults={
                    'group': grupo or 'Z',  # 'Z' para fase eliminatória
                    'flag_url': home_flag,
                }
            )
            if created:
                times_criados += 1
            else:
                times_atualizados += 1

            # ── Cria/atualiza Time Visitante ──────────────────────────────────
            team_away, created = Team.objects.update_or_create(
                name=away_name,
                defaults={
                    'group': grupo or 'Z',
                    'flag_url': away_flag,
                }
            )
            if created:
                times_criados += 1
            else:
                times_atualizados += 1

            # ── Cria/atualiza Partida ─────────────────────────────────────────
            # Usa home_team + away_team como chave única (sem depender da data exata)
            match, created = Match.objects.update_or_create(
                home_team=team_home,
                away_team=team_away,
                defaults={
                    'match_date': match_date,
                    'home_score': home_score,
                    'away_score': away_score,
                    'status': status,
                }
            )

            # Aciona o cálculo de pontos do bolão (lógica no model.save)
            match.save()

            if created:
                jogos_criados += 1
                self.stdout.write(f'  ✨ Criado: {home_name} x {away_name} ({match_date.strftime("%d/%m/%Y %H:%M")}) [{status}]')
            else:
                jogos_atualizados += 1
                self.stdout.write(f'  🔄 Atualizado: {home_name} x {away_name} → {status} ({home_score}-{away_score})')

        # ── 4. Resumo final ───────────────────────────────────────────────────
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('═' * 50))
        self.stdout.write(self.style.SUCCESS('✅ Sincronização concluída!'))
        self.stdout.write(f'   Times criados:    {times_criados}')
        self.stdout.write(f'   Times atualizados: {times_atualizados}')
        self.stdout.write(f'   Jogos criados:    {jogos_criados}')
        self.stdout.write(f'   Jogos atualizados: {jogos_atualizados}')
        if jogos_ignorados:
            self.stdout.write(self.style.WARNING(f'   Jogos ignorados:  {jogos_ignorados}'))
        self.stdout.write(self.style.SUCCESS('═' * 50))
