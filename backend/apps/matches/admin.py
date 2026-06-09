from django.contrib import admin
from .models import Team, Match

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'group')
    search_fields = ('name',)
    list_filter = ('group',)

@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ('home_team', 'away_team', 'match_date', 'status')
    list_filter = ('status', 'match_date')
    search_fields = ('home_team__name', 'away_team__name')