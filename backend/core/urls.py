from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from apps.matches.views import TeamViewSet, MatchViewSet, BolaoViewSet, MatchCommentViewSet, BolaoCommentViewSet
from apps.bets.views import BetViewSet, RankingListView, MyBetsListView, RegisterView, UserProfileView, StatsView

# O Router cria automaticamente as rotas de listar e detalhar
router = DefaultRouter()
router.register(r'teams', TeamViewSet)
router.register(r'matches', MatchViewSet)
router.register(r'bets', BetViewSet)
router.register(r'bolaos', BolaoViewSet)  # NOVO: Endpoints de bolão
router.register(r'comments', MatchCommentViewSet, basename='comments')
router.register(r'bolao_comments', BolaoCommentViewSet, basename='bolao_comments')

urlpatterns = [
    path('admin/', admin.site.urls),
    # Todas as nossas rotas vão ficar embaixo de /api/
    # Rota para fazer o Login (Recebe usuário e senha, devolve o Token)
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # Rota para renovar o Token quando ele expirar
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Rota para cadastro de novos usuários
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/me/', UserProfileView.as_view(), name='user-profile'),
    
    path('api/', include(router.urls)),
    path('api/my-bets/', MyBetsListView.as_view(), name='my-bets'),
    path('api/ranking/', RankingListView.as_view(), name='ranking'),
    path('api/stats/', StatsView.as_view(), name='stats'),
]