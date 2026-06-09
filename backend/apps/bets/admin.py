from django.contrib import admin
from .models import Bet

@admin.register(Bet)
class BetAdmin(admin.ModelAdmin):
    list_display = ('user', 'match', 'home_score', 'away_score', 'points_earned')
    list_filter = ('user', 'match__status')
    search_fields = ('user__username', 'match__home_team__name', 'match__away_team__name')