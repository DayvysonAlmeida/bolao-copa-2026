from rest_framework import viewsets
from .models import Team, Match
from .serializers import TeamSerializer, MatchSerializer

# ReadOnlyModelViewSet significa que, por padrão, nossa API só permite LER os jogos. 
# Apenas o painel Admin que você testou pode CRIAR jogos oficiais.
class TeamViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Team.objects.all().order_by('name')
    serializer_class = TeamSerializer

from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.core.cache import cache
from django.core.management import call_command
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
            try:
                # Roda a sincronização de forma silenciosa
                call_command('sync_football_data')
            except Exception as e:
                logger.error(f"Erro no auto-sync de jogos: {e}")
                cache.delete('last_football_sync') # Deleta para tentar de novo logo
                
        # Retorna a lista de jogos normalmente para o usuário (a renderização continua)
        return super().list(request, *args, **kwargs)