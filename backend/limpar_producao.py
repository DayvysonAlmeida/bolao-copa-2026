import os
import django

# Configuração padrão do Django (ajuste se no seu servidor o settings for diferente)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from apps.matches.models import Match, Team

def limpar():
    print("Iniciando limpeza do banco de dados na Produção...")
    
    # 1. Identificar times clonados pela API (que ganharam o grupo '-' por não ter o nome exato)
    teams_dash = Team.objects.filter(group='-')
    count_teams = teams_dash.count()

    if count_teams > 0:
        matches = Match.objects.filter(home_team__in=teams_dash) | Match.objects.filter(away_team__in=teams_dash)
        matches = matches.distinct()
        
        matches_to_delete_ids = []
        
        for m in matches:
            # 🚨 TRAVA DE SEGURANÇA MÁXIMA 🚨
            # Verifica se algum usuário já palpitou neste jogo clonado
            if m.bets.exists():
                print(f"⚠️ ATENÇÃO: O jogo duplicado '{m.home_team} x {m.away_team}' possui palpites! Ele NÃO será deletado para não perder NADA.")
            else:
                matches_to_delete_ids.append(m.id)
        
        # Deleta apenas os jogos duplicados que NÃO tem palpites
        if matches_to_delete_ids:
            count_matches, _ = Match.objects.filter(id__in=matches_to_delete_ids).delete()
            print(f"✅ {count_matches} jogos duplicados (sem palpites vinculados) foram deletados.")
        
        # Deleta os times clonados (somente os que não ficaram atrelados a nenhum jogo com palpite)
        teams_to_delete = Team.objects.filter(group='-', home_matches__isnull=True, away_matches__isnull=True)
        count_t, _ = teams_to_delete.delete()
        print(f"✅ {count_t} times clonados vazios foram deletados.")
    else:
        print("✅ Nenhum jogo/time duplicado com grupo '-' foi encontrado.")

    # 2. Corrigir qualquer time que tenha ficado isolado no grupo 'Z' (caso exista na produção também)
    teams_z = Team.objects.filter(group='Z')
    for t in teams_z:
        m = Match.objects.filter(home_team=t).exclude(away_team__group='Z').first()
        if not m:
            m = Match.objects.filter(away_team=t).exclude(home_team__group='Z').first()
        if m:
            other_team = m.away_team if m.home_team == t else m.home_team
            t.group = other_team.group
            t.save()
            print(f"✅ Corrigido: O time {t.name} voltou para o Grupo {t.group}")

    print("Limpeza finalizada com 100% de segurança!")

if __name__ == '__main__':
    limpar()
