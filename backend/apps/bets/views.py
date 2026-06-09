from rest_framework import viewsets, generics
from .models import Bet
from .serializers import BetSerializer, RankingSerializer
from django.contrib.auth.models import User
from django.db.models import Sum
from django.db.models.functions import Coalesce

# Usamos ModelViewSet porque aqui queremos o pacote completo: 
# Criar, Ler, Atualizar e Deletar palpites via API.
class BetViewSet(viewsets.ModelViewSet):
    queryset = Bet.objects.all()
    serializer_class = BetSerializer
    
    # Dica de ouro: Mais para frente, podemos adicionar aqui uma validação 
    # para impedir que o usuário altere o palpite se o jogo já tiver começado!

class MyBetsListView(generics.ListAPIView):
    serializer_class = BetSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous:
            return Bet.objects.none()
        return Bet.objects.filter(user=user)

class RankingListView(generics.ListAPIView):
    """Retorna a lista de usuários ordenada pela maior pontuação"""
    serializer_class = RankingSerializer

    def get_queryset(self):
        # O 'annotate' cria uma coluna temporária 'total_points' que soma o 'points_earned' dos palpites
        # O '-total_points' no order_by garante que o maior venha primeiro (ordem decrescente)
        return User.objects.annotate(
            total_points=Coalesce(Sum('bets__points_earned'), 0)
        ).order_by('-total_points')    