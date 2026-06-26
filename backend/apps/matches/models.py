from django.db import models


# ═══════════════════════════════════════════════════════════════════════════════
# BOLÃO — Agrupa partidas e participantes em campeonatos independentes
# ═══════════════════════════════════════════════════════════════════════════════
class Bolao(models.Model):
    """Modelo para gerenciar múltiplos bolões independentes.
    Cada bolão tem seu próprio ranking, partidas e regras de pontuação."""
    SCORING_CHOICES = (
        ('STANDARD', 'Padrão (5/3/0)'),
        ('KNOCKOUT', 'Mata-Mata (8/5/3/0 com pênaltis)'),
    )
    STATUS_CHOICES = (
        ('OPEN', 'Aberto para palpites'),
        ('LOCKED', 'Trancado (jogos em andamento)'),
        ('FINISHED', 'Encerrado'),
    )
    name = models.CharField(max_length=200, verbose_name="Nome do Bolão")
    description = models.TextField(blank=True, verbose_name="Descrição")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN', verbose_name="Status")
    scoring_mode = models.CharField(max_length=20, choices=SCORING_CHOICES, default='STANDARD', verbose_name="Modo de Pontuação")
    is_active = models.BooleanField(default=False, verbose_name="Bolão Ativo", help_text="Qual bolão aparece por padrão no frontend")
    allow_registration = models.BooleanField(default=True, verbose_name="Permitir Inscrições")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Bolão"
        verbose_name_plural = "Bolões"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"

    def save(self, *args, **kwargs):
        # Se está marcando este como ativo, desmarca os outros
        if self.is_active:
            Bolao.objects.filter(is_active=True).exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

class Team(models.Model):
    """Tabela para armazenar as Seleções da Copa"""
    name = models.CharField(max_length=100, unique=True, verbose_name="Nome da Seleção")
    group = models.CharField(max_length=1, verbose_name="Grupo", help_text="Ex: A, B, C...")
    flag_url = models.URLField(blank=True, null=True, verbose_name="URL da Bandeira")

    def __str__(self):
        return self.name

class Match(models.Model):
    """Tabela para armazenar as Partidas"""
    STATUS_CHOICES = (
        ('PENDING', 'Pendente'),
        ('IN_PROGRESS', 'Em Andamento'),
        ('FINISHED', 'Finalizado'),
    )
    
    # ── Campos novos (aditivos, null=True para não quebrar dados existentes) ──
    bolao = models.ForeignKey(Bolao, on_delete=models.SET_NULL, null=True, blank=True, related_name='matches', verbose_name="Bolão")
    phase = models.CharField(max_length=30, blank=True, default='', verbose_name="Fase", help_text="Ex: GROUP_STAGE, ROUND_16, QUARTER_FINALS...")
    match_number = models.IntegerField(null=True, blank=True, verbose_name="Número do Jogo (FIFA)", help_text="Ex: 73, 74, 75...")
    penalty_winner = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name='penalty_wins', verbose_name="Classificado nos Pênaltis")

    # ── Campos originais (INTOCADOS) ─────────────────────────────────────────
    # Relações com a tabela Team (Time da Casa e Time de Fora)
    home_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='home_matches', verbose_name="Time Casa")
    away_team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='away_matches', verbose_name="Time Fora")
    
    # Placares (Começam vazios/nulos até o jogo acontecer)
    home_score = models.IntegerField(null=True, blank=True, verbose_name="Gols Casa")
    away_score = models.IntegerField(null=True, blank=True, verbose_name="Gols Fora")
    
    match_date = models.DateTimeField(verbose_name="Data e Hora do Jogo")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', verbose_name="Status")

    def __str__(self):
        return f"{self.home_team} x {self.away_team} - {self.match_date.strftime('%d/%m/%Y')}"


    def save(self, *args, **kwargs):
        # 1. Primeiro, salva a partida no banco de dados normalmente
        super().save(*args, **kwargs)

        # 2. Se a partida terminou ou está em andamento e tem um placar definido, calcula os pontos (ao vivo)
        if self.status in ['FINISHED', 'IN_PROGRESS'] and self.home_score is not None and self.away_score is not None:

            # Pega todos os palpites atrelados a esta partida
            for bet in self.bets.all():
                pontos = 0

                # Regra 1: Placar Exato (5 pontos)
                if bet.home_score == self.home_score and bet.away_score == self.away_score:
                    pontos = 5
                else:
                    # Regra 2: Acertar o Resultado (3 pontos)
                    # Descobrindo o resultado real
                    if self.home_score > self.away_score:
                        resultado_real = 'CASA'
                    elif self.away_score > self.home_score:
                        resultado_real = 'FORA'
                    else:
                        resultado_real = 'EMPATE'

                    # Descobrindo o resultado do palpite
                    if bet.home_score > bet.away_score:
                        resultado_palpite = 'CASA'
                    elif bet.away_score > bet.home_score:
                        resultado_palpite = 'FORA'
                    else:
                        resultado_palpite = 'EMPATE'

                    # Se acertou a tendência (vencedor ou empate)
                    if resultado_real == resultado_palpite:
                        pontos = 3

                # Atualiza os pontos do palpite no banco de dados
                if bet.points_earned != pontos:
                    bet.points_earned = pontos
                    bet.save()    
        else:
            # Reseta os pontos se a partida voltou para PENDING ou não tem placar
            for bet in self.bets.all():
                if bet.points_earned != 0:
                    bet.points_earned = 0
                    bet.save()

# ═══════════════════════════════════════════════════════════════════════════════
# RESENHA — Chat/Comentários por Partida
# ═══════════════════════════════════════════════════════════════════════════════
from django.contrib.auth.models import User

class MatchComment(models.Model):
    """Comentários dos usuários na resenha de cada jogo"""
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='comments', verbose_name="Partida")
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Usuário")
    text = models.TextField(verbose_name="Comentário")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Enviado em")

    class Meta:
        verbose_name = "Resenha"
        verbose_name_plural = "Resenhas"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} sobre {self.match}"

class BolaoComment(models.Model):
    """Comentários globais do bolão"""
    bolao = models.ForeignKey(Bolao, on_delete=models.CASCADE, related_name='comments', verbose_name="Bolão")
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Usuário")
    text = models.TextField(verbose_name="Comentário")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Enviado em")

    class Meta:
        verbose_name = "Resenha do Bolão"
        verbose_name_plural = "Resenhas dos Bolões"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} no bolão {self.bolao}"