import time
from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from django.core.management import call_command
from apps.matches.models import Match

class Command(BaseCommand):
    help = "Worker inteligente para rodar o sync de forma contínua com economia de recursos."

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("🤖 Iniciando Smart Sync Worker..."))
        
        while True:
            now = timezone.now()
            
            # Condição 1: Algum jogo rolando agora?
            has_live = Match.objects.filter(status='IN_PROGRESS').exists()
            
            # Condição 2: Algum jogo programado para as próximas 2 horas?
            two_hours_from_now = now + timedelta(hours=2)
            has_upcoming = Match.objects.filter(status='PENDING', match_date__lte=two_hours_from_now, match_date__gte=now).exists()
            
            # Condição 3: Jogos recém iniciados (até 3 horas atrás) que podem não ter recebido atualização de status
            three_hours_ago = now - timedelta(hours=3)
            has_recently_started = Match.objects.filter(status__in=['PENDING', 'IN_PROGRESS'], match_date__lte=now, match_date__gte=three_hours_ago).exists()

            if has_live or has_upcoming or has_recently_started:
                self.stdout.write(f"[{now.strftime('%d/%m %H:%M:%S')}] ⚡ MODO ATIVO: Jogos acontecendo ou próximos. Sincronizando...")
                try:
                    # Chama o sync normal (sem --only-finished, pois queremos atualizar jogos IN_PROGRESS)
                    call_command('sync_football_data')
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Erro no sync: {e}"))
                
                self.stdout.write("⏳ Aguardando 3 minutos...")
                time.sleep(180) # 3 minutos
            else:
                self.stdout.write(f"[{now.strftime('%d/%m %H:%M:%S')}] 💤 MODO DORMIR: Nenhum jogo próximo. Aguardando 1 hora...")
                time.sleep(3600) # 1 hora
