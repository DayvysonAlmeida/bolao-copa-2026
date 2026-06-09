from django.db import models
from django.contrib.auth.models import User
from apps.matches.models import Match

class Bet(models.Model):
    """Tabela para armazenar os palpites dos usuários"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bets', verbose_name="Usuário")
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='bets', verbose_name="Partida")
    
    # O palpite em si
    home_score = models.PositiveIntegerField(verbose_name="Palpite Gols Casa")
    away_score = models.PositiveIntegerField(verbose_name="Palpite Gols Fora")
    
    # Este campo guardará a pontuação que o usuário ganhou (calculado após o jogo acabar)
    points_earned = models.IntegerField(default=0, verbose_name="Pontos Ganhos")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Regra de ouro: Um usuário só pode ter UM palpite por partida
        unique_together = ['user', 'match']
        verbose_name = "Palpite"
        verbose_name_plural = "Palpites"

    def __str__(self):
        return f"{self.user.username} | {self.match.home_team} {self.home_score} x {self.away_score} {self.match.away_team}"