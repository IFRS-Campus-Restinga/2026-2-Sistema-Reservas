from django.db import migrations
from django.db.models import Q


def confirmar_reservas_pendentes_antigas(apps, schema_editor):
    Reserva = apps.get_model("api", "Reserva")

    reservas_a_confirmar = (
        Reserva.objects
        .filter(status="PENDENTE")
        .exclude(usuario__papel="convidado")
        .exclude(tipo_reserva="EXTERNA")
        .filter(
            Q(reservaarea__isnull=False)
            |
            Q(
                reservarecursogeral__isnull=False,
                reservarecursogeral__recurso_geral__tem_termo_de_responsabilidade=False,
            )
        )
    )

    reservas_a_confirmar.update(status="CONFIRMADA")


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0022_alter_notificacao_tipo"),
    ]

    operations = [
        migrations.RunPython(
            confirmar_reservas_pendentes_antigas,
            migrations.RunPython.noop,
        ),
    ]