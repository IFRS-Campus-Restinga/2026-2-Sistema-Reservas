# Acrescenta categoria aos tipos existentes sem apagar dados ou reservas.
from django.db import migrations, models


CATEGORIAS_ANTIGAS = {
    'Informática': 'TECNOLOGIA',
    'Audiovisual': 'TECNOLOGIA',
    'Material esportivo': 'ESPORTES',
    'Ferramentas': 'MANUTENCAO',
    'Material de apoio': 'APOIO',
    'Notebooks': 'TECNOLOGIA',
    'Mouses': 'TECNOLOGIA',
    'Teclados': 'TECNOLOGIA',
    'Projetores': 'TECNOLOGIA',
    'Caixas de som': 'TECNOLOGIA',
    'Microfones': 'TECNOLOGIA',
    'Câmeras fotográficas': 'TECNOLOGIA',
    'Bolas': 'ESPORTES',
    'Redes de vôlei': 'ESPORTES',
    'Cones': 'ESPORTES',
    'Furadeiras': 'MANUTENCAO',
    'Caixas de ferramentas': 'MANUTENCAO',
    'Extensões elétricas': 'APOIO',
    'Suportes para projetor': 'TECNOLOGIA',
}


def classificar_tipos_existentes(apps, schema_editor):
    TipoRecurso = apps.get_model('api', 'TipoRecurso')
    for descricao, categoria in CATEGORIAS_ANTIGAS.items():
        TipoRecurso.objects.filter(descricao=descricao).update(categoria=categoria)


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0003_alter_recursogeral_nome_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='tiporecurso',
            name='categoria',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('TECNOLOGIA', 'Tecnologia e audiovisual'),
                    ('ESPORTES', 'Materiais esportivos'),
                    ('MANUTENCAO', 'Manutenção'),
                    ('APOIO', 'Materiais de apoio'),
                    ('OUTROS', 'Outros'),
                ],
                default='OUTROS',
            ),
        ),
        migrations.RunPython(classificar_tipos_existentes, migrations.RunPython.noop),
    ]
