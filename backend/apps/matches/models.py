from django.db import models

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