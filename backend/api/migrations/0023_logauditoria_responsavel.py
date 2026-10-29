import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0022_autorizacao_grupo'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RenameField(
            model_name='logauditoria',
            old_name='admin',
            new_name='responsavel',
        ),
        migrations.AlterField(
            model_name='logauditoria',
            name='responsavel',
            field=models.ForeignKey(help_text='Usuário que executou a ação.', on_delete=django.db.models.deletion.PROTECT, related_name='acoes_auditadas', to=settings.AUTH_USER_MODEL, verbose_name='Responsável'),
        ),
        migrations.AddField(
            model_name='logauditoria',
            name='perfil_responsavel',
            field=models.CharField(choices=[('admin', 'Administrador'), ('servidor', 'Servidor')], default='admin', help_text='Perfil do responsável no momento da ação.', max_length=12, verbose_name='Perfil do responsável'),
            preserve_default=False,
        ),
    ]
