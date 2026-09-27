from django.core.management.base import BaseCommand
from django.db import transaction
from datetime import timedelta
from django.utils import timezone
from api.models.recurso_geral_model import RecursoGeral
from api.validators.reserva_recurso_geral_validator import ocupacao_maxima

class Command(BaseCommand):
    help = "Recalcula o estoque reservado a partir das reservas ativas."

    def handle(self, *args, **options):
        with transaction.atomic():
            recursos = list(RecursoGeral.objects.select_for_update())
            agora = timezone.localtime().replace(tzinfo=None)
            for recurso in recursos:
                ocupadas = ocupacao_maxima(
                    recurso, agora, agora + timedelta(seconds=1)
                )
                RecursoGeral.objects.filter(pk=recurso.pk).update(
                    quantidade_reservada=ocupadas
                )

        self.stdout.write(self.style.SUCCESS("Estoque reservado atualizado."))
