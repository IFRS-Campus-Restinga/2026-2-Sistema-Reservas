# Transforma os equipamentos da área (antes uma lista JSON de valores fixos) em uma tabela editável.
from django.db import migrations, models

# Valores do antigo enum EquipamentoArea -> nome cadastrado
EQUIPAMENTOS = {
    'PROJETOR': 'Projetor',
    'AR_CONDICIONADO': 'Ar condicionado',
    'QUADRO_BRANCO': 'Quadro branco',
    'COMPUTADOR': 'Computador',
    'SISTEMA_DE_SOM': 'Sistema de som',
    'TV': 'TV',
}


def migrar_equipamentos(apps, schema_editor):
    Area = apps.get_model('api', 'Area')
    EquipamentoArea = apps.get_model('api', 'EquipamentoArea')
    # Cria as opções que já existiam, mesmo que nenhuma área use, para o admin não perder nada.
    por_codigo = {
        codigo: EquipamentoArea.objects.get_or_create(nome=nome)[0]
        for codigo, nome in EQUIPAMENTOS.items()
    }
    for area in Area.objects.all():
        codigos = area.equipamento or []
        area.equipamentos.set([por_codigo[codigo] for codigo in codigos if codigo in por_codigo])


def reverter_equipamentos(apps, schema_editor):
    Area = apps.get_model('api', 'Area')
    por_nome = {nome: codigo for codigo, nome in EQUIPAMENTOS.items()}
    for area in Area.objects.prefetch_related('equipamentos'):
        area.equipamento = [por_nome[e.nome] for e in area.equipamentos.all() if e.nome in por_nome]
        area.save(update_fields=['equipamento'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0029_categoriarecurso'),
    ]

    operations = [
        migrations.CreateModel(
            name='EquipamentoArea',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=50, unique=True)),
            ],
            options={
                'verbose_name': 'Equipamento de área',
                'verbose_name_plural': 'Equipamentos de área',
                'db_table': 'equipamento_area',
                'ordering': ['nome'],
            },
        ),
        migrations.AddField(
            model_name='area',
            name='equipamentos',
            field=models.ManyToManyField(blank=True, help_text='Equipamentos encontrados na área', related_name='areas', to='api.equipamentoarea'),
        ),
        migrations.RunPython(migrar_equipamentos, reverter_equipamentos),
        migrations.RemoveField(
            model_name='area',
            name='equipamento',
        ),
        migrations.AlterField(
            model_name='logauditoria',
            name='entidade',
            field=models.CharField(choices=[('RESERVA_AREA', 'Reserva de área'), ('RESERVA_VEICULO', 'Reserva de veículo'), ('RESERVA_RECURSO_GERAL', 'Reserva de recurso geral'), ('RECORRENCIA_RESERVA_AREA', 'Recorrência de reserva de área'), ('RECORRENCIA_RESERVA_VEICULO', 'Recorrência de reserva de veículo'), ('RECORRENCIA_RESERVA_RECURSO', 'Recorrência de reserva de recurso geral'), ('GRUPO', 'Grupo'), ('MEMBRO_GRUPO', 'Membro de grupo'), ('RECURSO_GERAL', 'Recurso geral'), ('TIPO_RECURSO', 'Tipo de recurso'), ('CATEGORIA_RECURSO', 'Categoria de recurso'), ('AREA', 'Área'), ('EQUIPAMENTO_AREA', 'Equipamento de área'), ('BLOCO', 'Bloco'), ('VEICULO', 'Veículo'), ('TIMETABLE', 'Timetable')], max_length=30, verbose_name='Entidade'),
        ),
    ]
