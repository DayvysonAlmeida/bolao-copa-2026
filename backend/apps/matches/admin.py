from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Team, Match, Bolao

class HasBetsFilter(admin.SimpleListFilter):
    title = _('tem palpites?')
    parameter_name = 'has_bets'

    def lookups(self, request, model_admin):
        return (
            ('yes', _('Sim (Com palpites)')),
            ('no',  _('Não (Sem palpites)')),
        )

    def queryset(self, request, queryset):
        if self.value() == 'yes':
            return queryset.filter(bets__isnull=False).distinct()
        if self.value() == 'no':
            return queryset.filter(bets__isnull=True)
        return queryset


@admin.register(Bolao)
class BolaoAdmin(admin.ModelAdmin):
    list_display = ('name', 'status', 'scoring_mode', 'is_active', 'allow_registration', 'created_at')
    list_filter = ('status', 'scoring_mode', 'is_active')
    list_editable = ('status', 'is_active', 'allow_registration')
    search_fields = ('name',)

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'group')
    search_fields = ('name',)
    list_filter = ('group',)

@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ('home_team', 'away_team', 'bolao', 'match_date', 'status')
    list_filter = ('bolao', 'status', HasBetsFilter, 'match_date')
    search_fields = ('home_team__name', 'away_team__name')
    actions = ['recalculate_points_action']

    @admin.action(description='Forçar varredura e recálculo de pontos')
    def recalculate_points_action(self, request, queryset):
        from django.core.management import call_command
        call_command('resync_points')
        self.message_user(request, "Sincronização profunda concluída com sucesso! Pontos e Ranking atualizados.")