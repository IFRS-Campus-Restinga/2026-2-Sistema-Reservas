
import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0004_reserva"),
        ("api", "0004_tiporecurso_categoria"),
    ]

    operations = [
        migrations.CreateModel(
            name="ReservaRecursoGeral",
            fields=[
                (
                    "reserva_ptr",
                    models.OneToOneField(
                        auto_created=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        parent_link=True,
                        primary_key=True,
                        serialize=False,
                        to="api.reserva",
                    ),
                ),
                (
                    "data_devolucao_prevista",
                    models.DateField(
                        verbose_name="Data de devolução prevista"
                    ),
                ),
                (
                    "quantidades",
                    models.IntegerField(
                        validators=[
                            django.core.validators.MinValueValidator(1)
                        ],
                        verbose_name="Quantidade",
                    ),
                ),
                (
                    "recurso_geral",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="reservas",
                        to="api.recursogeral",
                        verbose_name="Recurso geral",
                    ),
                ),
            ],
            options={
                "verbose_name": "Reserva de recurso geral",
                "verbose_name_plural": "Reservas de recursos gerais",
            },
            bases=("api.reserva",),
        ),
    ]
