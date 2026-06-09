from rest_framework import serializers
from .models import Team, Match

class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = '__all__'

class MatchSerializer(serializers.ModelSerializer):
    # Campos extras para o React não precisar adivinhar o nome do time, apenas receber pronto
    home_team_name = serializers.ReadOnlyField(source='home_team.name')
    away_team_name = serializers.ReadOnlyField(source='away_team.name')
    flag_home = serializers.ReadOnlyField(source='home_team.flag_url')
    flag_away = serializers.ReadOnlyField(source='away_team.flag_url')
    group = serializers.ReadOnlyField(source='home_team.group')

    class Meta:
        model = Match
        fields = [
            'id', 'home_team', 'away_team', 'home_team_name', 'away_team_name', 
            'flag_home', 'flag_away', 'group', 'home_score', 'away_score', 'match_date', 'status'
        ]