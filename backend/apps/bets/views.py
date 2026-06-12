from rest_framework import viewsets, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Bet
from .serializers import BetSerializer, RankingSerializer, UserSerializer
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
            total_points=Coalesce(Sum('bets__points_earned'), 0)
        ).order_by('-total_points')    

class RegisterView(APIView):
    """Endpoint para cadastro de novos usuários no bolão"""
    permission_classes = [AllowAny] # Permite que qualquer pessoa acesse sem estar logada

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        email = request.data.get('email', '')

        if not username or not password:
            return Response({'error': 'Usuário e senha são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Este usuário já está em uso. Escolha outro.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Cria o usuário padrão (sem acesso ao admin, mas com permissão para logar e palpitar)
        user = User.objects.create_user(
            username=username, 
            password=password,
            first_name=first_name,
            last_name=last_name,
            email=email
        )
        return Response({'success': 'Conta criada com sucesso!'}, status=status.HTTP_201_CREATED)

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