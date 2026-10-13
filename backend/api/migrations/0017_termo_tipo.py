from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0016_termoresponsabilidade'),
    ]

    operations = [
        migrations.AddField(
            model_name='termoresponsabilidade',
            name='tipo',
            field=models.CharField(
                choices=[
                    ('RESPONSABILIDADE', 'Responsabilidade'),
                    ('RETIRADA_VEICULO', 'Retirada de veículo'),
                    ('DEVOLUCAO_VEICULO', 'Devolução de veículo'),
                ],
                default='RESPONSABILIDADE',
                max_length=24,
            ),
        ),
        migrations.RemoveConstraint(
            model_name='termoresponsabilidade',
            name='termo_atual_por_reserva',
        ),
        migrations.AddConstraint(
            model_name='termoresponsabilidade',
            constraint=models.UniqueConstraint(
                condition=models.Q(('atual', True)),
                fields=('reserva', 'tipo'),
                name='termo_atual_por_reserva_tipo',
            ),
        ),
    ]
