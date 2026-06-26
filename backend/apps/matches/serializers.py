from rest_framework import serializers
from .models import Team, Match, Bolao, MatchComment, BolaoComment

class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = '__all__'


class BolaoSerializer(serializers.ModelSerializer):
    """Serializer para o modelo Bolão"""
    participants_count = serializers.SerializerMethodField()

    class Meta:
        model = Bolao
        fields = ['id', 'name', 'description', 'status', 'scoring_mode', 'is_active', 'allow_registration', 'created_at', 'participants_count']

    def get_participants_count(self, obj):
        return obj.participants.filter(confirmed=True).count()


class MatchSerializer(serializers.ModelSerializer):
    # Campos extras para o React não precisar adivinhar o nome do time, apenas receber pronto
    home_team_name = serializers.ReadOnlyField(source='home_team.name')
    away_team_name = serializers.ReadOnlyField(source='away_team.name')
    flag_home = serializers.ReadOnlyField(source='home_team.flag_url')
    flag_away = serializers.ReadOnlyField(source='away_team.flag_url')
    group = serializers.ReadOnlyField(source='home_team.group')
    # Campos novos (aditivos)
    penalty_winner_name = serializers.ReadOnlyField(source='penalty_winner.name')
    bolao_name = serializers.ReadOnlyField(source='bolao.name')
    scoring_mode = serializers.ReadOnlyField(source='bolao.scoring_mode')

    class Meta:
        model = Match
        fields = [
            'id', 'home_team', 'away_team', 'home_team_name', 'away_team_name', 
            'flag_home', 'flag_away', 'group', 'home_score', 'away_score', 'match_date', 'status',
            'bolao', 'bolao_name', 'phase', 'penalty_winner', 'penalty_winner_name', 'scoring_mode'
        ]

class MatchCommentSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    first_name = serializers.ReadOnlyField(source='user.first_name')
    last_name = serializers.ReadOnlyField(source='user.last_name')

    class Meta:
        model = MatchComment
        fields = ['id', 'match', 'user', 'username', 'first_name', 'last_name', 'text', 'created_at']
        read_only_fields = ['user']

class BolaoCommentSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    first_name = serializers.ReadOnlyField(source='user.first_name')
    last_name = serializers.ReadOnlyField(source='user.last_name')

    class Meta:
        model = BolaoComment
        fields = ['id', 'bolao', 'user', 'username', 'first_name', 'last_name', 'text', 'created_at']
        read_only_fields = ['user']