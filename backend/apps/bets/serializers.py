from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Bet


class BetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bet
        fields = ['id', 'user', 'match', 'home_score', 'away_score', 'points_earned']
        # Segurança máxima: O frontend pode enviar os placares, mas nunca os pontos ganhos.
        # Os pontos serão calculados apenas pelo nosso backend.
        read_only_fields = ['points_earned']


class RankingSerializer(serializers.ModelSerializer):
    # Declaramos um campo virtual que será gerado pela View
    total_points = serializers.IntegerField(read_only=True)
    trend = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'total_points', 'trend']

    def get_trend(self, obj):
        if not hasattr(obj, 'profile'):
            return 'SAME'
        
        # O Ranking é decrescente. Então posição menor = mais alto (melhor).
        # Porém, se previous for 0 (novo usuário), não comparamos.
        if obj.profile.previous_position == 0:
            return 'SAME'

        if obj.profile.current_position < obj.profile.previous_position:
            return 'UP'
        elif obj.profile.current_position > obj.profile.previous_position:
            return 'DOWN'
        return 'SAME'


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'is_staff', 'is_superuser']
        read_only_fields = ['id', 'username', 'is_staff', 'is_superuser']