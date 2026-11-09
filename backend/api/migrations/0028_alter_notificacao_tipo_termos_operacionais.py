from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0027_alter_logauditoria_entidade'),
    ]

    operations = [
        migrations.AlterField(
            model_name='notificacao',
            name='tipo',
            field=models.CharField(choices=[('CONFIRMACAO_RESERVA', 'Confirmação de reserva'), ('CANCELAMENTO_RESERVA', 'Cancelamento de reserva'), ('REJEICAO_RESERVA', 'Rejeição de reserva'), ('TERMO_ENVIADO', 'Termo enviado'), ('TERMO_REENVIADO', 'Termo reenviado'), ('TERMO_APROVADO', 'Termo aprovado'), ('TERMO_REJEITADO', 'Termo rejeitado'), ('RETIRADA_ENVIADA', 'Termo de retirada enviado'), ('RETIRADA_REENVIADA', 'Termo de retirada reenviado'), ('RETIRADA_APROVADA', 'Termo de retirada aprovado'), ('RETIRADA_REJEITADA', 'Termo de retirada rejeitado'), ('DEVOLUCAO_ENVIADA', 'Termo de devolução enviado'), ('DEVOLUCAO_REENVIADA', 'Termo de devolução reenviado'), ('DEVOLUCAO_APROVADA', 'Termo de devolução aprovado'), ('DEVOLUCAO_REJEITADA', 'Termo de devolução rejeitado')], max_length=30, verbose_name='Tipo'),
        ),
    ]
