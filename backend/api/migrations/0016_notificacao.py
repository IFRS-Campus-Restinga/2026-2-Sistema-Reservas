import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0015_log_auditoria"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Notificacao",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("tipo", models.CharField(choices=[("CONFIRMACAO_RESERVA", "Confirmação de reserva"), ("CANCELAMENTO_RESERVA", "Cancelamento de reserva"), ("REJEICAO_RESERVA", "Rejeição de reserva")], max_length=30, verbose_name="Tipo")),
                ("titulo", models.CharField(max_length=100, verbose_name="Título")),
                ("mensagem", models.CharField(max_length=255, verbose_name="Mensagem")),
                ("lida", models.BooleanField(default=False, verbose_name="Lida")),
                ("criada_em", models.DateTimeField(auto_now_add=True, verbose_name="Criada em")),
                ("lida_em", models.DateTimeField(blank=True, null=True, verbose_name="Lida em")),
                ("reserva", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="notificacoes", to="api.reserva", verbose_name="Reserva")),
                ("usuario", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="notificacoes", to=settings.AUTH_USER_MODEL, verbose_name="Usuário")),
            ],
            options={
                "verbose_name": "Notificação",
                "verbose_name_plural": "Notificações",
                "db_table": "notificacao",
                "ordering": ["-criada_em"],
                "indexes": [models.Index(fields=["usuario", "lida", "-criada_em"], name="notificacao_usuario_lida_idx")],
                "constraints": [models.UniqueConstraint(fields=("usuario", "reserva", "tipo"), name="notificacao_unica_usuario_reserva_tipo")],
            },
        ),
    ]
