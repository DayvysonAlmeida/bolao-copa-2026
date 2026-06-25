from django.db import models
from django.contrib.auth.models import User
from apps.matches.models import Match, Team, Bolao
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    previous_position = models.IntegerField(default=0)
    current_position = models.IntegerField(default=0)
    previous_points = models.IntegerField(default=0)
    current_points = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.username} - Pos: {self.current_position}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


# ═══════════════════════════════════════════════════════════════════════════════
# BOLÃO PARTICIPANT — Participação confirmada por bolão (NOVO - NÃO MEXE NO UserProfile)
# ═══════════════════════════════════════════════════════════════════════════════
class BolaoParticipant(models.Model):
    """Controla a participação de cada usuário em cada bolão.
    O usuário precisa confirmar participação para poder palpitar."""
    bolao = models.ForeignKey(Bolao, on_delete=models.CASCADE, related_name='participants', verbose_name="Bolão")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bolao_participations', verbose_name="Usuário")
    confirmed = models.BooleanField(default=False, verbose_name="Confirmou Participação")
    previous_position = models.IntegerField(default=0, verbose_name="Posição Anterior")
    current_position = models.IntegerField(default=0, verbose_name="Posição Atual")
    previous_points = models.IntegerField(default=0, verbose_name="Pontos Anteriores")
    current_points = models.IntegerField(default=0, verbose_name="Pontos Atuais")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['bolao', 'user']
        verbose_name = "Participante do Bolão"
        verbose_name_plural = "Participantes do Bolão"

    def __str__(self):
        status = "✓" if self.confirmed else "⏳"
        return f"{status} {self.user.username} em {self.bolao.name}"

class Bet(models.Model):
    """Tabela para armazenar os palpites dos usuários"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bets', verbose_name="Usuário")
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='bets', verbose_name="Partida")
    
    # O palpite em si
    home_score = models.PositiveIntegerField(verbose_name="Palpite Gols Casa")
    away_score = models.PositiveIntegerField(verbose_name="Palpite Gols Fora")
    
    # ── Campo novo (aditivo, null=True — só usado no mata-mata) ──
    penalty_winner = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True,
        verbose_name="Classificado nos Pênaltis", help_text="Só preenchido quando o palpite é empate no mata-mata")

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