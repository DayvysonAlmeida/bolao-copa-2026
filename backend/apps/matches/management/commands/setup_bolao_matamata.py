from django.core.management.base import BaseCommand
from apps.matches.models import Match, Bolao
from django.contrib.auth.models import User
from apps.bets.models import BolaoParticipant
from django.db import transaction

class Command(BaseCommand):
    help = "Migra os dados atuais para o sistema de bolões e cria o bolão do Mata-Mata"

    def handle(self, *args, **options):
        with transaction.atomic():
            self.stdout.write("Iniciando migração para o sistema multi-bolão...")

            # 1. Cria o bolão da Fase de Grupos
            bolao_grupos, created = Bolao.objects.get_or_create(
                name="Copa 2026 — Fase de Grupos",
                defaults={
                    'description': 'Bolão da fase de grupos da Copa do Mundo 2026.',
                    'status': 'FINISHED',
                    'scoring_mode': 'STANDARD',
                    'is_active': False,
                    'allow_registration': False,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Bolão '{bolao_grupos.name}' criado."))

            # 2. Associa todas as partidas existentes que não têm bolão a este bolão
            matches_atualizados = Match.objects.filter(bolao__isnull=True).update(bolao=bolao_grupos)
            self.stdout.write(self.style.SUCCESS(f"{matches_atualizados} partidas associadas ao bolão da Fase de Grupos."))

            # 3. Cria participantes para a Fase de Grupos (para manter o histórico do ranking)
            usuarios_fase_grupos = User.objects.filter(bets__match__bolao=bolao_grupos).distinct()
            participantes_criados = 0
            for user in usuarios_fase_grupos:
                participant, p_created = BolaoParticipant.objects.get_or_create(
                    bolao=bolao_grupos,
                    user=user,
                    defaults={'confirmed': True}
                )
                if p_created:
                    # Tenta copiar as posições do UserProfile antigo, se existir
                    if hasattr(user, 'profile'):
                        participant.previous_position = user.profile.previous_position
                        participant.current_position = user.profile.current_position
                        participant.previous_points = user.profile.previous_points
                        participant.current_points = user.profile.current_points
                        participant.save()
                    participantes_criados += 1
            
            self.stdout.write(self.style.SUCCESS(f"{participantes_criados} participantes migrados para o bolão da Fase de Grupos."))

            # 4. Cria o bolão do Mata-Mata
            bolao_matamata, created = Bolao.objects.get_or_create(
                name="Copa 2026 — Mata-Mata",
                defaults={
                    'description': 'Bolão da fase de mata-mata da Copa do Mundo 2026. Regras especiais para pênaltis!',
                    'status': 'OPEN',
                    'scoring_mode': 'KNOCKOUT',
                    'is_active': True,
                    'allow_registration': True,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Bolão '{bolao_matamata.name}' criado e ativado."))
            else:
                bolao_matamata.is_active = True
                bolao_matamata.save()

            # 5. Cria participantes (não confirmados) para todos os usuários existentes no novo bolão
            todos_usuarios = User.objects.all()
            convites_criados = 0
            for user in todos_usuarios:
                _, p_created = BolaoParticipant.objects.get_or_create(
                    bolao=bolao_matamata,
                    user=user,
                    defaults={'confirmed': False}
                )
                if p_created:
                    convites_criados += 1
            
            self.stdout.write(self.style.SUCCESS(f"{convites_criados} usuários pré-inscritos no bolão do Mata-Mata (aguardando confirmação)."))

            self.stdout.write(self.style.SUCCESS("Migração concluída com sucesso!"))
