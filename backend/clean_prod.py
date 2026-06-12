import os
import django

# Setup django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.matches.models import Match
from django.db.models import Count

def clean():
    # Encontra pares de times com mais de 1 partida
    dups = Match.objects.values('home_team', 'away_team').annotate(c=Count('id')).filter(c__gt=1)
    
    deleted_count = 0
    print(f"Encontrados {len(dups)} jogos duplicados (mesmo time casa x fora).")
    
    for m in dups:
        # Busca as partidas desse confronto, ordenadas por ID (as originais têm ID menor)
        matches = list(Match.objects.filter(home_team_id=m['home_team'], away_team_id=m['away_team']).order_by('id'))
        
        # Mantém a primeira partida (original) e analisa as demais
        original = matches[0]
        duplicates = matches[1:]
        
        for dup in duplicates:
            # Verifica se o clone tem algum palpite amarrado
            if dup.bets.exists():
                print(f"⚠️ AVISO: A duplicata ID {dup.id} ({dup.home_team.name} x {dup.away_team.name}) tem palpites atrelados! Não apagada.")
            else:
                # Se não tem palpites, podemos apagar a duplicata com segurança
                print(f"🗑️ Apagando clone ID {dup.id} ({dup.home_team.name} x {dup.away_team.name})...")
                dup.delete()
                deleted_count += 1
                
    print(f"\n✅ Limpeza concluída: {deleted_count} jogos duplicados excluídos na produção.")

if __name__ == '__main__':
    clean()
