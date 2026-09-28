from django.db import migrations, models


def espaco_para_area(apps, schema_editor):
    Grupo = apps.get_model('api', 'Grupo')
    Grupo.objects.filter(tipo_recurso_autorizado='ESPACO').update(tipo_recurso_autorizado='AREA')


def area_para_espaco(apps, schema_editor):
    Grupo = apps.get_model('api', 'Grupo')
    Grupo.objects.filter(tipo_recurso_autorizado='AREA').update(tipo_recurso_autorizado='ESPACO')


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_merge_20260927_1944'),
    ]

    operations = [
        migrations.AlterField(
            model_name='grupo',
            name='tipo_recurso_autorizado',
            field=models.CharField(choices=[('AREA', 'Área'), ('VEICULO', 'Veículo'), ('RECURSO_GERAL', 'Recurso Geral')], help_text='Tipo de recurso que o grupo está autorizado a reservar.', max_length=20),
        ),
        migrations.RunPython(espaco_para_area, area_para_espaco),
    ]
