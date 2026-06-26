from django.core.management.base import BaseCommand
from apps.matches.models import Team, Match
from django.db import transaction

class Command(BaseCommand):
    help = "Corrige conflitos de nomes das seleções e apaga clones criados pela API"

    def handle(self, *args, **options):
        # Mapeamento: Nome ANTIGO (do seu banco) -> Nome NOVO (da nova API)
        name_fixes = {
            "República Democrática do Congo": "RD Congo",
            "República Tcheca": "República Checa",
            "Curaçau": "Curaçao"
        }
        
        with transaction.atomic():
            for old_name, new_name in name_fixes.items():
                self.stdout.write(f"Verificando conflito: {old_name} -> {new_name}...")
                
                old_team = Team.objects.filter(name=old_name).first()
                new_team = Team.objects.filter(name=new_name).first()
                
                if old_team and new_team:
                    self.stdout.write(f"  - Conflito detectado! Apagando jogos do clone '{new_name}'...")
                    Match.objects.filter(home_team=new_team).delete()
                    Match.objects.filter(away_team=new_team).delete()
                    new_team.delete()
                    self.stdout.write(f"  - Clone '{new_name}' deletado.")
                    
                    old_team.name = new_name
                    old_team.save()
                    self.stdout.write(self.style.SUCCESS(f"  - Histórico salvo! Antigo renomeado para '{new_name}'."))
                
                elif old_team and not new_team:
                    old_team.name = new_name
                    old_team.save()
                    self.stdout.write(self.style.SUCCESS(f"  - Antigo renomeado para '{new_name}' sem problemas."))
                else:
                    self.stdout.write("  - Sem conflitos para este time.")
            
            # Limpeza cirúrgica: Apagar jogos VAZIOS que já possuem uma versão COM PALPITES
            matches_without_bets = Match.objects.filter(bets__isnull=True)
            deleted = 0
            for m in matches_without_bets:
                # Existe algum jogo com esses mesmos times que TEM palpites?
                has_real_game = Match.objects.filter(
                    home_team=m.home_team, 
                    away_team=m.away_team, 
                    bets__isnull=False
                ).exists()
                
                if has_real_game:
                    m.delete()
                    deleted += 1
                    
            if deleted > 0:
                self.stdout.write(self.style.SUCCESS(f"Limpeza extra: {deleted} jogos duplicados vazios foram apagados."))

            self.stdout.write(self.style.SUCCESS("Tudo limpo e padronizado!"))
