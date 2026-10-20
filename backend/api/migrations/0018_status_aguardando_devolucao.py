from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0017_termo_tipo'),
    ]

    operations = [
        migrations.AlterField(
            model_name='reserva',
            name='status',
            field=models.CharField(
                choices=[
                    ('PENDENTE', 'Pendente'),
                    ('CONFIRMADA', 'Confirmada'),
                    ('CANCELADA', 'Cancelada'),
                    ('REJEITADA', 'Rejeitada'),
                    ('AGUARDANDO_TERMO', 'Aguardando termo'),
                    ('AGUARDANDO_TERMO_DEVOLUCAO', 'Aguardando termo de devolução'),
                    ('CONCLUIDA', 'Concluída'),
                ],
                default='PENDENTE',
                verbose_name='Status',
            ),
        ),
    ]
