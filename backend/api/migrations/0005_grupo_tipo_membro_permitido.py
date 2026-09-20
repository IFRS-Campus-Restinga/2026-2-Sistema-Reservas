from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_grupo_grupoaluno_gruposervidor_membrogrupo'),
    ]

    operations = [
        migrations.AddField(
            model_name='grupo',
            name='tipo_membro_permitido',
            field=models.CharField(
                choices=[('servidor', 'Servidor'), ('aluno', 'Aluno')],
                default='aluno',
                help_text='Papel de usuário (servidor ou aluno) autorizado a ser membro deste grupo.',
                max_length=12,
            ),
            preserve_default=False,
        ),
        migrations.DeleteModel(
            name='GrupoAluno',
        ),
        migrations.DeleteModel(
            name='GrupoServidor',
        ),
    ]
