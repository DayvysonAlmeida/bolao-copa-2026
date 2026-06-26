from rest_framework import viewsets
from .models import Team, Match, Bolao
from .serializers import TeamSerializer, MatchSerializer, BolaoSerializer

# ReadOnlyModelViewSet significa que, por padrão, nossa API só permite LER os jogos. 
# Apenas o painel Admin que você testou pode CRIAR jogos oficiais.
class TeamViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Team.objects.all().order_by('name')
    serializer_class = TeamSerializer

from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.core.cache import cache
from django.core.management import call_command
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
import logging

logger = logging.getLogger(__name__)

@method_decorator(cache_page(60), name='dispatch')
class MatchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Match.objects.select_related('home_team', 'away_team').all().order_by('match_date')
    serializer_class = MatchSerializer
    
    def list(self, request, *args, **kwargs):
        # Verifica no cache se faz mais de 1 minuto (60s) desde o último sync para atualizar mais rápido
        last_sync = cache.get('last_football_sync')
        
        if not last_sync:
            # Coloca no cache imediatamente para que se 10 usuários entrarem juntos, 
            # apenas 1 disparo de sync seja feito
            cache.set('last_football_sync', True, timeout=60)
            def run_sync():
                try:
                    call_command('sync_football_data')
                except Exception as e:
                    logger.error(f"Erro no auto-sync de jogos: {e}")
                    cache.delete('last_football_sync')
            
            import threading
            threading.Thread(target=run_sync).start()
                
        # Retorna a lista de jogos normalmente para o usuário (a renderização continua)
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def sync_api(self, request):
        """POST /api/matches/sync_api/ — Sincroniza a API da Copa do Mundo (Somente Admin)"""
        if not request.user.is_staff:
            return Response({"error": "Apenas admins podem rodar a sincronização"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            call_command('sync_football_data')
            # Limpa o cache após sincronizar
            cache.delete('last_football_sync')
            return Response({"message": "Sincronização da Copa do Mundo concluída com sucesso!"})
        except Exception as e:
            logger.error(f"Erro na sincronização manual: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ═══════════════════════════════════════════════════════════════════════════════
# BOLÃO VIEWSET — Endpoints novos (NÃO mexe nos existentes acima)
# ═══════════════════════════════════════════════════════════════════════════════
from django.db.models import Sum, Count, Q
from django.db.models.functions import Coalesce

class BolaoViewSet(viewsets.ReadOnlyModelViewSet):
    """API para gerenciar bolões. Listar, ver ativo, confirmar participação, ranking e stats."""
    queryset = Bolao.objects.all().order_by('-created_at')
    serializer_class = BolaoSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        """Retorna a lista de bolões, adicionando status do usuário logado."""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data

        if request.user.is_authenticated:
            from apps.bets.models import BolaoParticipant
            # Busca todas as participações desse usuário
            participations = BolaoParticipant.objects.filter(user=request.user)
            part_dict = {p.bolao_id: p.confirmed for p in participations}

            for item in data:
                item['user_joined'] = item['id'] in part_dict
                item['user_confirmed'] = part_dict.get(item['id'], False)
        else:
            for item in data:
                item['user_joined'] = False
                item['user_confirmed'] = False

        return Response(data)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """GET /api/bolaos/active/ — Retorna o bolão ativo no momento"""
        bolao = Bolao.objects.filter(is_active=True).first()
        if not bolao:
            return Response({'detail': 'Nenhum bolão ativo no momento.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(bolao)
        data = serializer.data
        # Se o user está logado, informa se já confirmou participação
        if request.user.is_authenticated:
            from apps.bets.models import BolaoParticipant
            participant = BolaoParticipant.objects.filter(bolao=bolao, user=request.user).first()
            data['user_confirmed'] = participant.confirmed if participant else False
            data['user_joined'] = participant is not None
        return Response(data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def join(self, request, pk=None):
        """POST /api/bolaos/{id}/join/ — Confirma participação do usuário"""
        bolao = self.get_object()
        if not bolao.allow_registration:
            return Response({'error': 'Inscrições encerradas para este bolão.'}, status=status.HTTP_403_FORBIDDEN)
        
        from apps.bets.models import BolaoParticipant
        participant, created = BolaoParticipant.objects.get_or_create(
            bolao=bolao, user=request.user,
            defaults={'confirmed': True}
        )
        if not created and not participant.confirmed:
            participant.confirmed = True
            participant.save()
        
        return Response({
            'message': f'Você está inscrito no bolão "{bolao.name}"!',
            'confirmed': True,
            'bolao_id': bolao.id,
            'bolao_name': bolao.name
        })

    @action(detail=True, methods=['get'])
    def ranking(self, request, pk=None):
        """GET /api/bolaos/{id}/ranking/ — Ranking deste bolão específico"""
        bolao = self.get_object()
        from django.contrib.auth.models import User
        from apps.bets.models import BolaoParticipant

        # Apenas participantes confirmados
        confirmed_user_ids = BolaoParticipant.objects.filter(
            bolao=bolao, confirmed=True
        ).values_list('user_id', flat=True)

        users = User.objects.filter(id__in=confirmed_user_ids).annotate(
            total_points=Coalesce(
                Sum('bets__points_earned', filter=Q(
                    bets__match__bolao=bolao,
                    bets__match__status__in=['FINISHED', 'IN_PROGRESS']
                )), 0
            ),
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

        # Calcular trend baseado no BolaoParticipant
        results = []
        for i, user in enumerate(users):
            participant = BolaoParticipant.objects.filter(bolao=bolao, user=user).first()
            trend = 'SAME'
            if participant and participant.previous_position > 0:
                if participant.current_position < participant.previous_position:
                    trend = 'UP'
                elif participant.current_position > participant.previous_position:
                    trend = 'DOWN'
                elif participant.current_points > participant.previous_points:
                    trend = 'UP'

            results.append({
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'total_points': user.total_points,
                'cravadas': user.cravadas,
                'acertos': user.acertos,
                'trend': trend,
            })

        return Response(results)

    @action(detail=True, methods=['get'])
    def matches(self, request, pk=None):
        """GET /api/bolaos/{id}/matches/ — Jogos deste bolão"""
        # Auto-sync silencioso a cada 60s
        from django.core.cache import cache
        from django.core.management import call_command
        import logging
        logger = logging.getLogger(__name__)

        last_sync = cache.get('last_football_sync')
        if not last_sync:
            cache.set('last_football_sync', True, timeout=60)
            
            def run_sync_bolao():
                try:
                    call_command('sync_football_data')
                except Exception as e:
                    logger.error(f"Erro no auto-sync de jogos no bolão: {e}")
                    cache.delete('last_football_sync')
            
            import threading
            threading.Thread(target=run_sync_bolao).start()

        bolao = self.get_object()
        matches = Match.objects.filter(bolao=bolao).select_related(
            'home_team', 'away_team', 'penalty_winner', 'bolao'
        ).order_by('match_date')
        serializer = MatchSerializer(matches, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """GET /api/bolaos/{id}/stats/ — Estatísticas deste bolão"""
        bolao = self.get_object()
        from django.contrib.auth.models import User
        from django.db.models import Avg
        from apps.bets.models import BolaoParticipant

        confirmed_user_ids = BolaoParticipant.objects.filter(
            bolao=bolao, confirmed=True
        ).values_list('user_id', flat=True)

        # Top scorer (mais cravadas)
        top_scorer = None
        user_crav = User.objects.filter(
            id__in=confirmed_user_ids,
            bets__points_earned__gte=5,
            bets__match__bolao=bolao
        ).annotate(cravadas=Count('bets')).order_by('-cravadas').first()
        if user_crav:
            top_scorer = f"{user_crav.first_name or user_crav.username} ({user_crav.cravadas} cravadas)"

        # Mais acertos
        safest_player = None
        user_acertos = User.objects.filter(
            id__in=confirmed_user_ids,
            bets__points_earned=3,
            bets__match__bolao=bolao
        ).annotate(acertos=Count('bets')).order_by('-acertos').first()
        if user_acertos:
            safest_player = f"{user_acertos.first_name or user_acertos.username} ({user_acertos.acertos} acertos)"

        # Lanterna e média
        users_with_pts = User.objects.filter(id__in=confirmed_user_ids).annotate(
            total_points=Coalesce(Sum('bets__points_earned', filter=Q(bets__match__bolao=bolao)), 0)
        )
        lanterna = None
        lanterna_user = users_with_pts.order_by('total_points').first()
        if lanterna_user:
            lanterna = f"{lanterna_user.first_name or lanterna_user.username} ({lanterna_user.total_points} pts)"

        media_calc = users_with_pts.aggregate(avg_points=Avg('total_points'))
        media_pontos = round(media_calc['avg_points'] or 0, 1)

        return Response({
            "bolao_name": bolao.name,
            "scoring_mode": bolao.scoring_mode,
            "top_scorer": top_scorer or "Ninguém ainda",
            "safest_player": safest_player or "Ninguém ainda",
            "lanterna": lanterna or "Ninguém ainda",
            "media_pontos": media_pontos,
        })

# ═══════════════════════════════════════════════════════════════════════════════
# RESENHA VIEWSET — Para o Chat das Partidas
# ═══════════════════════════════════════════════════════════════════════════════
from .models import MatchComment, BolaoComment
from .serializers import MatchCommentSerializer, BolaoCommentSerializer

class MatchCommentViewSet(viewsets.ModelViewSet):
    serializer_class = MatchCommentSerializer
    
    def get_permissions(self):
        # Apenas usuários logados podem comentar, mas qualquer um pode ler (ou apenas logados podem ler também)
        from rest_framework.permissions import IsAuthenticatedOrReadOnly
        return [IsAuthenticatedOrReadOnly()]

    def get_queryset(self):
        queryset = MatchComment.objects.select_related('user').all()
        match_id = self.request.query_params.get('match', None)
        if match_id is not None:
            queryset = queryset.filter(match_id=match_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class BolaoCommentViewSet(viewsets.ModelViewSet):
    serializer_class = BolaoCommentSerializer
    
    def get_permissions(self):
        from rest_framework.permissions import IsAuthenticatedOrReadOnly
        return [IsAuthenticatedOrReadOnly()]

    def get_queryset(self):
        queryset = BolaoComment.objects.select_related('user').all()
        bolao_id = self.request.query_params.get('bolao', None)
        if bolao_id is not None:
            queryset = queryset.filter(bolao_id=bolao_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)