import json

from django.conf import settings
from django.core.management.base import BaseCommand

from accounts.services.administrador_service import autorizar_administrador


class Command(BaseCommand):
    help = 'Cadastra os administradores listados em scripts/administradores.json.'

    def handle(self, *args, **options):
        arquivo = settings.BASE_DIR / 'scripts' / 'administradores.json'
        administradores = json.loads(arquivo.read_text(encoding='utf-8'))
        for administrador in administradores:
            autorizar_administrador(administrador['email'])
        self.stdout.write(self.style.SUCCESS(f'{len(administradores)} administrador(es) cadastrado(s).'))
