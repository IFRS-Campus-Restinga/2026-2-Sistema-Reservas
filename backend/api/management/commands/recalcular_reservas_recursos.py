from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Sum

from api.models.recurso_geral_model import RecursoGeral
from api.models.reserva_recurso_geral_model import ReservaRecursoGeral
from api.validators.reserva_recurso_geral_validator import STATUS_RESERVAS_ATIVAS


class Command(BaseCommand):
    help = "Recalcula o estoque reservado a partir das reservas ativas."

    def handle(self, *args, **options):
        with transaction.atomic():
            recursos = list(RecursoGeral.objects.select_for_update())
            quantidades = dict(
                ReservaRecursoGeral.objects.filter(status__in=STATUS_RESERVAS_ATIVAS)
                .values("recurso_geral_id")
                .annotate(total=Sum("quantidades"))
                .values_list("recurso_geral_id", "total")
            )

            inconsistentes = [
                recurso.nome
                for recurso in recursos
                if quantidades.get(recurso.pk, 0) > recurso.quantidade_total
            ]

            if inconsistentes:
                raise CommandError(
                    "Há mais unidades reservadas do que cadastradas: "
                    + ", ".join(inconsistentes)
                )

            for recurso in recursos:
                RecursoGeral.objects.filter(pk=recurso.pk).update(
                    quantidade_reservada=quantidades.get(recurso.pk, 0)
                )

        self.stdout.write(self.style.SUCCESS("Estoque reservado atualizado."))
