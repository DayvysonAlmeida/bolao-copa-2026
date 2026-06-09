from rest_framework import viewsets
from .models import Team, Match
from .serializers import TeamSerializer, MatchSerializer

# ReadOnlyModelViewSet significa que, por padrão, nossa API só permite LER os jogos. 
# Apenas o painel Admin que você testou pode CRIAR jogos oficiais.
class TeamViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Team.objects.all().order_by('name')
    serializer_class = TeamSerializer

class MatchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Match.objects.all().order_by('match_date')
    serializer_class = MatchSerializer