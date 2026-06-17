from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.matches.models import Match
from apps.bets.models import Bet
import random

class Command(BaseCommand):
    help = "Popula o banco com palpites fictícios para todos os usuários existentes em todas as partidas (para testes locais)."

    def handle(self, *args, **kwargs):
        users = User.objects.all()
        matches = Match.objects.all()

        if not users.exists():
            self.stdout.write(self.style.ERROR("Nenhum usuário encontrado no banco de dados. Crie usuários primeiro."))
            return
            
        if not matches.exists():
            self.stdout.write(self.style.ERROR("Nenhuma partida encontrada no banco de dados. Sincronize os jogos primeiro."))
            return

        self.stdout.write(f"Iniciando a criação de palpites falsos para {users.count()} usuários e {matches.count()} partidas...")
        
        palpites_criados = 0
        
        for user in users:
            for match in matches:
                # O get_or_create garante que só vamos gerar um palpite se o usuário ainda não tiver palpitado naquele jogo.
                # Seus palpites reais não serão apagados!
                
                # Para dar uma graça, vamos gerar pontuações de 0 a 3, com alguns pesos
                # Mais chance de 1, 0 ou 2.
                opcoes_gols = [0, 0, 1, 1, 1, 2, 2, 3]
                
                bet, created = Bet.objects.get_or_create(
                    user=user,
                    match=match,
                    defaults={
                        'home_score': random.choice(opcoes_gols),
                        'away_score': random.choice(opcoes_gols)
                    }
                )
                if created:
                    palpites_criados += 1

        self.stdout.write(self.style.SUCCESS(f"[SUCESSO] {palpites_criados} novos palpites fictícios criados!"))
        
        self.stdout.write("Recalculando pontos para jogos já finalizados ou em andamento...")
        # Atualizando os pontos
        matches_to_recalc = Match.objects.filter(status__in=['FINISHED', 'IN_PROGRESS'])
        for m in matches_to_recalc:
            m.save() # Isso engatilha o recalculo automático do seu model Match!
            
        self.stdout.write(self.style.SUCCESS("[SUCESSO] Pontos recalculados! Ranking atualizado."))
