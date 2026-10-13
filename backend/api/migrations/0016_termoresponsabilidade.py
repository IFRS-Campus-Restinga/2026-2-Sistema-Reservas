import api.models.termo_responsabilidade_model
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0016_merge_20261011_1927'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='TermoResponsabilidade',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('arquivo_original', models.FileField(max_length=255, upload_to=api.models.termo_responsabilidade_model.caminho_documento)),
                ('arquivo_assinado', models.FileField(max_length=255, upload_to=api.models.termo_responsabilidade_model.caminho_documento)),
                ('nome_original', models.CharField(max_length=255)),
                ('status', models.CharField(choices=[('PENDENTE', 'Pendente'), ('APROVADO', 'Aprovado'), ('REJEITADO', 'Rejeitado')], default='PENDENTE', max_length=10)),
                ('atual', models.BooleanField(default=True)),
                ('data_envio', models.DateTimeField(auto_now_add=True)),
                ('data_validacao', models.DateTimeField(blank=True, null=True)),
                ('motivo_rejeicao', models.TextField(blank=True, max_length=1000)),
                ('enviado_por', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='termos_enviados', to=settings.AUTH_USER_MODEL)),
                ('reserva', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='termos', to='api.reserva')),
                ('validado_por', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='termos_analisados', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-data_envio', '-pk'],
                'constraints': [models.UniqueConstraint(condition=models.Q(('atual', True)), fields=('reserva',), name='termo_atual_por_reserva')],
            },
        ),
    ]
