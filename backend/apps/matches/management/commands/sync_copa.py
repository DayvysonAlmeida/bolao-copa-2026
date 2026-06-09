import json
import os
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils.dateparse import parse_datetime
from apps.matches.models import Team, Match

class Command(BaseCommand):
    help = 'Lê o arquivo copa_2026_dados.json e atualiza o banco de dados'

    def handle(self, *args, **kwargs):
        self.stdout.write("Lendo dados locais do JSON...")

        # Monta o caminho exato para o arquivo JSON dentro do seu projeto
        json_path = os.path.join(settings.BASE_DIR, 'apps', 'matches', 'copa_2026_dados.json')

        try:
            with open(json_path, 'r', encoding='utf-8') as file:
                data = json.load(file)

            # 1. Inserir ou atualizar Seleções
            self.stdout.write("Sincronizando seleções...")
            for s in data.get('selecoes', []):
                Team.objects.update_or_create(
                    name=s['nome'],
                    defaults={
                        'group': s['grupo'],
                        'flag_url': s['bandeira']
                    }
                )

            # 2. Inserir ou atualizar Partidas
            self.stdout.write("Sincronizando partidas...")
            jogos_processados = 0
            
            for p in data.get('partidas', []):
                # Busca as instâncias dos times no banco
                try:
                    team_home = Team.objects.get(name=p['time_casa'])
                    team_away = Team.objects.get(name=p['time_fora'])
                except Team.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f"Ignorando jogo: {p['time_casa']} ou {p['time_fora']} não cadastrado."))
                    continue

                match_date = parse_datetime(p['data'])

                match, created = Match.objects.update_or_create(
                    home_team=team_home,
                    away_team=team_away,
                    match_date=match_date,
                    defaults={
                        'home_score': p['gols_casa'],
                        'away_score': p['gols_fora'],
                        'status': p['status']
                    }
                )
                
                # Salva para ativar a regra do bolão caso o status mude para FINISHED
                match.save()
                jogos_processados += 1

            self.stdout.write(self.style.SUCCESS(f"Sucesso! {jogos_processados} partidas sincronizadas com o banco."))

        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f"Arquivo não encontrado: {json_path}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Erro inesperado: {str(e)}"))