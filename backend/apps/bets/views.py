from rest_framework import viewsets, generics
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Bet
from .serializers import BetSerializer, RankingSerializer, UserSerializer
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import User
# pyrefly: ignore [missing-import]
from django.db.models import Sum, Count, Q
from django.db.models.functions import Coalesce

# Usamos ModelViewSet porque aqui queremos o pacote completo: 
# Criar, Ler, Atualizar e Deletar palpites via API.
class BetViewSet(viewsets.ModelViewSet):
    queryset = Bet.objects.select_related('user', 'match', 'match__home_team', 'match__away_team').all()
    serializer_class = BetSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        user = self.request.user
        
        if user.is_staff:
            # O admin pode mandar o usuário no JSON. Se não mandar, usa ele mesmo.
            serializer.save()
        else:
            # Força o usuário a ser quem está logado
            serializer.save(user=user)

    def perform_update(self, serializer):
        user = self.request.user
        bet = self.get_object()
        
        # Se for um usuário normal tentando editar o palpite de outra pessoa
        if not user.is_staff and bet.user != user:
            raise ValidationError("Você não tem permissão para alterar este palpite.")
            
        serializer.save()

class MyBetsListView(generics.ListAPIView):
    serializer_class = BetSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous:
            return Bet.objects.none()
        return Bet.objects.select_related('match', 'match__home_team', 'match__away_team').filter(user=user)

from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

@method_decorator(cache_page(60), name='dispatch')
class RankingListView(generics.ListAPIView):
    """Retorna a lista de usuários ordenada pela maior pontuação"""
    serializer_class = RankingSerializer

    def get_queryset(self):
        # O 'annotate' cria uma coluna temporária 'total_points' que soma o 'points_earned' dos palpites
        # O '-total_points' no order_by garante que o maior venha primeiro (ordem decrescente)
        return User.objects.annotate(
            total_points=Coalesce(Sum('bets__points_earned', filter=Q(bets__match__status__in=['FINISHED', 'IN_PROGRESS'])), 0),
            cravadas=Count('bets', filter=Q(bets__points_earned=5, bets__match__status__in=['FINISHED', 'IN_PROGRESS'])),
            acertos=Count('bets', filter=Q(bets__points_earned=3, bets__match__status__in=['FINISHED', 'IN_PROGRESS']))
        ).order_by('-total_points', '-cravadas', '-acertos', 'id')    

class RegisterView(APIView):
    """Endpoint para cadastro de novos usuários no bolão"""
    permission_classes = [AllowAny] # Permite que qualquer pessoa acesse sem estar logada

    def post(self, request):
        return Response(
            {'error': 'Novos cadastros estão temporariamente desativados até o próximo bolão.'}, 
            status=status.HTTP_403_FORBIDDEN
        )

class UserProfileView(APIView):
    """Endpoint para visualizar e editar os dados do próprio usuário autenticado"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        user = request.user
        
        # Atualiza dados básicos
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        if 'email' in request.data:
            user.email = request.data['email']
            
        # Atualiza senha se for fornecida
        password = request.data.get('password')
        if password:
            user.set_password(password)
            
        user.save()
        
        serializer = UserSerializer(user)
        return Response(serializer.data)

from django.db.models import Count, Sum, Avg
from django.db.models.functions import Coalesce

@method_decorator(cache_page(60), name='dispatch')
class StatsView(APIView):
    """Retorna curiosidades e estatísticas do bolão"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        top_scorer = None
        user_5pts = User.objects.filter(bets__points_earned=5).annotate(cravadas=Count('bets')).order_by('-cravadas').first()
        if user_5pts:
            top_scorer = f"{user_5pts.first_name or user_5pts.username} ({user_5pts.cravadas} cravadas)"

        safest_player = None
        user_3pts = User.objects.filter(bets__points_earned=3).annotate(acertos=Count('bets')).order_by('-acertos').first()
        if user_3pts:
            safest_player = f"{user_3pts.first_name or user_3pts.username} ({user_3pts.acertos} acertos)"

        # Cálculos de Lanterna e Média de Pontos
        users_with_points = User.objects.annotate(total_points=Coalesce(Sum('bets__points_earned'), 0))
        
        lanterna = None
        lanterna_user = users_with_points.order_by('total_points').first()
        if lanterna_user:
            lanterna = f"{lanterna_user.first_name or lanterna_user.username} ({lanterna_user.total_points} pts)"
            
        media_calc = users_with_points.aggregate(avg_points=Avg('total_points'))
        media_pontos = round(media_calc['avg_points'] or 0, 1)

        return Response({
            "top_scorer": top_scorer or "Ninguém ainda",
            "safest_player": safest_player or "Ninguém ainda",
            "lanterna": lanterna or "Ninguém ainda",
            "media_pontos": media_pontos
        })