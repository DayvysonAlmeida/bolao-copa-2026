import os
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Executa rotinas de deploy: migrações, sync_copa e criação de admin'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("1. Rodando migrações do banco de dados..."))
        call_command('migrate')

        self.stdout.write(self.style.WARNING("2. Sincronizando dados da Copa..."))
        call_command('sync_copa')

        self.stdout.write(self.style.WARNING("3. Configurando usuário administrador..."))
        User = get_user_model()
        
        # Pega as variáveis de ambiente com segurança (sem valores padrão perigosos)
        username = os.environ.get('DJANGO_SUPERUSER_USERNAME')
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')

        if username and email and password:
            if not User.objects.filter(username=username).exists():
                User.objects.create_superuser(username=username, email=email, password=password)
                self.stdout.write(self.style.SUCCESS(f"Superusuário '{username}' criado com sucesso!"))
            else:
                self.stdout.write(self.style.SUCCESS(f"Superusuário '{username}' já existe no banco. Tudo certo!"))
        else:
            self.stdout.write(self.style.ERROR("Variáveis de ambiente do superusuário não configuradas. Pulando criação automática."))
            
        self.stdout.write(self.style.SUCCESS("=== SETUP DE DEPLOY CONCLUÍDO ==="))