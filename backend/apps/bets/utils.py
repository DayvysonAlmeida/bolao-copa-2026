from django.db.models import Sum, Count, Q
from django.db.models.functions import Coalesce
from django.contrib.auth.models import User
from .models import UserProfile

def update_ranking_positions():
    """
    Recalcula o ranking atual e atualiza as posições no UserProfile.
    Deve ser chamado apenas quando um jogo é finalizado para gerar as setas de tendência.
    """
    users = User.objects.annotate(
        total_points=Coalesce(Sum('bets__points_earned', filter=Q(bets__match__status__in=['FINISHED', 'IN_PROGRESS'])), 0),
        cravadas=Count('bets', filter=Q(bets__points_earned=5, bets__match__status__in=['FINISHED', 'IN_PROGRESS'])),
        acertos=Count('bets', filter=Q(bets__points_earned=3, bets__match__status__in=['FINISHED', 'IN_PROGRESS']))
    ).order_by('-total_points', '-cravadas', '-acertos', 'id')

    current_rank = 1
    for user in users:
        profile, _ = UserProfile.objects.get_or_create(user=user)
        # A posição e pontos atuais viram os anteriores
        profile.previous_position = profile.current_position
        profile.previous_points = profile.current_points
        # Atualiza para os novos valores
        profile.current_position = current_rank
        profile.current_points = user.total_points
        profile.save()
        current_rank += 1
