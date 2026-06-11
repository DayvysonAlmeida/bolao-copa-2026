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

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'total_points']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']
        read_only_fields = ['id', 'username']