from django.core.management.base import BaseCommand
from apps.matches.models import Match, Bolao, Team
from django.utils import timezone
from datetime import datetime, timezone as dt_timezone

class Command(BaseCommand):
    help = "Popula o chaveamento do Mata-Mata com os jogos e placeholders (usando horários UTC precisos)"

    def handle(self, *args, **options):
        self.stdout.write("Procurando o bolão do Mata-Mata...")
        
        bolao = Bolao.objects.filter(scoring_mode='KNOCKOUT').first()
        if not bolao:
            self.stdout.write(self.style.ERROR("Bolão Mata-Mata não encontrado. Execute setup_bolao_matamata primeiro."))
            return
        
        self.stdout.write(self.style.WARNING(f"Deletando partidas antigas do bolão '{bolao.name}'..."))
        Match.objects.filter(bolao=bolao).delete()

        def get_team(name):
            translation = {
                "GER": "Alemanha",
                "RSA": "África do Sul",
                "CAN": "Canadá",
                "NED": "Holanda",
                "MAR": "Marrocos",
                "USA": "Estados Unidos",
                "BIH": "Bósnia e Herzegovina",
                "BRA": "Brasil",
                "JPN": "Japão",
                "CIV": "Costa do Marfim",
                "MEX": "México",
                "ARG": "Argentina",
                "AUS": "Austrália",
                "SUI": "Suíça"
            }
            real_name = translation.get(name, name)
            team, _ = Team.objects.get_or_create(name=real_name, defaults={'group': '-'})
            return team

        # Definindo a estrutura dos jogos (TimeCasa, TimeFora, DataHora UTC, Fase)
        # Convertemos os horários da imagem (BRT = UTC-3) para UTC exato.
        matches_data = [
            # ROUND_32 - Left Side (8)
            (74, "GER", "3ABCDF", "2026-06-29T20:30:00Z", "ROUND_32"), # J74 (17:30 BRT)
            (77, "1I", "3CDFGH", "2026-06-30T21:00:00Z", "ROUND_32"), # J77 (18:00 BRT)
            (73, "RSA", "CAN", "2026-06-28T19:00:00Z", "ROUND_32"), # J73 (16:00 BRT)
            (75, "NED", "MAR", "2026-06-30T01:00:00Z", "ROUND_32"), # J75 (22:00 BRT)
            (83, "2K", "2L", "2026-07-02T23:00:00Z", "ROUND_32"), # J83 (20:00 BRT)
            (84, "1H", "2J", "2026-07-02T19:00:00Z", "ROUND_32"), # J84 (16:00 BRT)
            (81, "USA", "BIH", "2026-07-02T00:00:00Z", "ROUND_32"), # J81 (21:00 BRT)
            (82, "1G", "3AEHIJ", "2026-07-01T20:00:00Z", "ROUND_32"), # J82 (17:00 BRT)

            # ROUND_32 - Right Side (8)
            (76, "BRA", "JPN", "2026-06-29T17:00:00Z", "ROUND_32"), # J76 (14:00 BRT)
            (78, "CIV", "2I", "2026-06-30T17:00:00Z", "ROUND_32"), # J78 (14:00 BRT)
            (79, "MEX", "3CEFHI", "2026-07-01T01:00:00Z", "ROUND_32"), # J79 (22:00 BRT)
            (80, "1L", "3EHIJK", "2026-07-01T16:00:00Z", "ROUND_32"), # J80 (13:00 BRT)
            (86, "ARG", "2H", "2026-07-03T22:00:00Z", "ROUND_32"), # J86 (19:00 BRT)
            (88, "AUS", "2G", "2026-07-03T18:00:00Z", "ROUND_32"), # J88 (15:00 BRT)
            (85, "SUI", "3EFGIJ", "2026-07-03T03:00:00Z", "ROUND_32"), # J85 (00:00 BRT)
            (87, "1K", "3DEIJL", "2026-07-04T01:30:00Z", "ROUND_32"), # J87 (22:30 BRT)

            # ROUND_16 - Oitavas (8) (Sempre +3h no UTC)
            (89, "W74", "W77", "2026-07-04T21:00:00Z", "ROUND_16"), # J89 (18:00 BRT)
            (90, "W73", "W75", "2026-07-04T17:00:00Z", "ROUND_16"), # J90 (14:00 BRT)
            (93, "W83", "W84", "2026-07-06T19:00:00Z", "ROUND_16"), # J93 (16:00 BRT)
            (94, "W81", "W82", "2026-07-07T00:00:00Z", "ROUND_16"), # J94 (21:00 BRT)
            (91, "W76", "W78", "2026-07-05T20:00:00Z", "ROUND_16"), # J91 (17:00 BRT)
            (92, "W79", "W80", "2026-07-06T00:00:00Z", "ROUND_16"), # J92 (21:00 BRT)
            (95, "W86", "W88", "2026-07-07T16:00:00Z", "ROUND_16"), # J95 (13:00 BRT)
            (96, "W85", "W87", "2026-07-07T20:00:00Z", "ROUND_16"), # J96 (17:00 BRT)

            # QUARTER_FINALS - Quartas (4)
            (97, "W89", "W90", "2026-07-09T20:00:00Z", "QUARTER_FINALS"), # 17:00 BRT
            (98, "W93", "W94", "2026-07-10T19:00:00Z", "QUARTER_FINALS"), # 16:00 BRT
            (99, "W91", "W92", "2026-07-11T21:00:00Z", "QUARTER_FINALS"), # 18:00 BRT
            (100, "W95", "W96", "2026-07-12T01:00:00Z", "QUARTER_FINALS"), # 22:00 BRT

            # SEMI_FINALS - Semis (2)
            (101, "W97", "W98", "2026-07-14T19:00:00Z", "SEMI_FINALS"), # 16:00 BRT
            (102, "W99", "W100", "2026-07-15T19:00:00Z", "SEMI_FINALS"), # 16:00 BRT

            # THIRD_PLACE (1)
            (103, "RU101", "RU102", "2026-07-18T21:00:00Z", "THIRD_PLACE"), # 18:00 BRT

            # FINAL (1)
            (104, "W101", "W102", "2026-07-19T19:00:00Z", "FINAL"), # 16:00 BRT
        ]

        for m_num, home_str, away_str, dt_str, phase in matches_data:
            home = get_team(home_str)
            away = get_team(away_str)
            dt = datetime.strptime(dt_str, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=dt_timezone.utc)
            
            Match.objects.create(
                match_number=m_num,
                bolao=bolao,
                home_team=home,
                away_team=away,
                phase=phase,
                match_date=dt,
                status='PENDING'
            )
        
        self.stdout.write(self.style.SUCCESS("32 partidas de Mata-Mata geradas com sucesso (horários UTC exatos)!"))
