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
    actions = ['recalculate_points_action']

    @admin.action(description='Forçar varredura e recálculo de pontos')
    def recalculate_points_action(self, request, queryset):
        from django.core.management import call_command
        call_command('resync_points')
        self.message_user(request, "Sincronização profunda concluída com sucesso! Pontos e Ranking atualizados.")