from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Bet


class BetSerializer(serializers.ModelSerializer):
    # Campo aditivo para exibir o nome do time classificado nos pênaltis
    penalty_winner_name = serializers.ReadOnlyField(source='penalty_winner.name')

    class Meta:
        model = Bet
        fields = ['id', 'user', 'match', 'home_score', 'away_score', 'points_earned', 'penalty_winner', 'penalty_winner_name']
        # Segurança máxima: O frontend pode enviar os placares, mas nunca os pontos ganhos.
        # Os pontos serão calculados apenas pelo nosso backend.
        read_only_fields = ['points_earned']

    def validate(self, data):
        # Em edições parciais, usamos os dados existentes combinados com os novos
        home_score = data.get('home_score', self.instance.home_score if self.instance else None)
        away_score = data.get('away_score', self.instance.away_score if self.instance else None)
        penalty_winner = data.get('penalty_winner', self.instance.penalty_winner if self.instance else None)
        match = data.get('match', self.instance.match if self.instance else None)

        if not match:
            raise serializers.ValidationError("Partida não informada.")

        # Validação de Segurança (Tempo e Status)
        # Admins (staff) podem contornar essa regra
        request = self.context.get('request')
        is_staff = request and request.user and request.user.is_staff

        if not is_staff:
            if match.status != 'PENDING':
                raise serializers.ValidationError("Apostas encerradas para este jogo.")
            
            from django.utils import timezone
            if timezone.now() >= match.match_date:
                raise serializers.ValidationError("O jogo já começou! Apostas bloqueadas pelo horário.")

        # Validação de Pênaltis no Mata-Mata
        if match.bolao and match.bolao.scoring_mode == 'KNOCKOUT':
            if home_score is not None and away_score is not None and home_score == away_score:
                if not penalty_winner:
                    raise serializers.ValidationError("No Mata-Mata, em caso de empate, você deve informar o vencedor dos pênaltis.")

        return data


class RankingSerializer(serializers.ModelSerializer):
    # Declaramos um campo virtual que será gerado pela View
    total_points = serializers.IntegerField(read_only=True)
    cravadas = serializers.IntegerField(read_only=True)
    acertos = serializers.IntegerField(read_only=True)
    trend = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'total_points', 'cravadas', 'acertos', 'trend']

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
            
        # Se manteve a posição, mas marcou pontos desde a última atualização
        if obj.profile.current_points > obj.profile.previous_points:
            return 'UP'
            
        return 'SAME'


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'is_staff', 'is_superuser']
        read_only_fields = ['id', 'username', 'is_staff', 'is_superuser']