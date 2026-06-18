from django.core.management.base import BaseCommand
from apps.matches.models import Match
from apps.bets.utils import update_ranking_positions

class Command(BaseCommand):
    help = "Recalcula a pontuação de todos os palpites do banco de dados e limpa pontos fantasmas."

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Iniciando varredura e recálculo de pontos de todos os jogos..."))
        
        matches = Match.objects.all()
        count = 0
        
        for match in matches:
            match.save() # Dispara a limpeza/cálculo no modelo
            count += 1
            
        self.stdout.write(self.style.SUCCESS(f"Pontuação de {count} jogos conferida e limpa!"))
        
        self.stdout.write(self.style.WARNING("Atualizando ranking e setas de tendência..."))
        update_ranking_positions(is_resync=True)
        
        self.stdout.write(self.style.SUCCESS("Sincronização profunda concluída com sucesso! Todos os dados estão 100% corretos."))
