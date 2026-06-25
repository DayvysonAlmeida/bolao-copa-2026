from django.contrib import admin
from .models import Bet, BolaoParticipant


@admin.register(BolaoParticipant)
class BolaoParticipantAdmin(admin.ModelAdmin):
    list_display = ('user', 'bolao', 'confirmed', 'current_position', 'current_points', 'joined_at')
    list_filter = ('bolao', 'confirmed')
    list_editable = ('confirmed',)
    search_fields = ('user__username', 'user__first_name')

@admin.register(Bet)
class BetAdmin(admin.ModelAdmin):
    list_display = ('user', 'match', 'home_score', 'away_score', 'points_earned')
    list_filter = ('user', 'match__status')
    search_fields = ('user__username', 'match__home_team__name', 'match__away_team__name')