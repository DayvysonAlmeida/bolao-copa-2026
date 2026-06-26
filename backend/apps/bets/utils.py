from django.db.models import Sum, Count, Q
from django.db.models.functions import Coalesce
from django.contrib.auth.models import User
from apps.matches.models import Bolao
from .models import UserProfile, BolaoParticipant

def update_ranking_positions(is_resync=False):
    """
    Recalcula o ranking atual e atualiza as posições no BolaoParticipant para cada bolão ativo.
    Deve ser chamado apenas quando um jogo sofre alteração para gerar as setas de tendência.
    """
    active_bolaos = Bolao.objects.filter(is_active=True)
    
    for bolao in active_bolaos:
        # Pega IDs dos usuários confirmados neste bolão
        confirmed_user_ids = BolaoParticipant.objects.filter(
            bolao=bolao, confirmed=True
        ).values_list('user_id', flat=True)

        users = User.objects.filter(id__in=confirmed_user_ids).annotate(
            total_points=Coalesce(Sum('bets__points_earned', filter=Q(
                bets__match__bolao=bolao, 
                bets__match__status__in=['FINISHED', 'IN_PROGRESS']
            )), 0),
            cravadas=Count('bets', filter=Q(
                bets__points_earned__gte=5, 
                bets__match__bolao=bolao, 
                bets__match__status__in=['FINISHED', 'IN_PROGRESS']
            )),
            acertos=Count('bets', filter=Q(
                bets__points_earned=3, 
                bets__match__bolao=bolao, 
                bets__match__status__in=['FINISHED', 'IN_PROGRESS']
            ))
        ).order_by('-total_points', '-cravadas', '-acertos', 'id')

        current_rank = 1
        for user in users:
            participant = BolaoParticipant.objects.filter(bolao=bolao, user=user).first()
            if participant:
                if is_resync:
                    participant.previous_position = current_rank
                    participant.previous_points = user.total_points
                else:
                    # A posição e pontos atuais viram os anteriores
                    participant.previous_position = participant.current_position
                    participant.previous_points = participant.current_points
                    
                # Atualiza para os novos valores
                participant.current_position = current_rank
                participant.current_points = user.total_points
                participant.save()
            current_rank += 1
