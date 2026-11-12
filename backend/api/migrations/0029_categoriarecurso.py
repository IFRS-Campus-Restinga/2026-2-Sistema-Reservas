# Transforma a categoria do tipo de recurso (antes um enum fixo) em uma tabela editável.
# Os tipos existentes são migrados para as mesmas categorias que o catálogo já exibia.
import django.db.models.deletion
from django.db import migrations, models

# Valor antigo do enum -> (nome da categoria, ícone)
CATEGORIAS = {
    'TECNOLOGIA': ('Informática', 'INFORMATICA'),
    'AUDIOVISUAL': ('Audiovisual', 'AUDIOVISUAL'),
    'ESPORTES': ('Material esportivo', 'MATERIAL_ESPORTIVO'),
    'MANUTENCAO': ('Ferramentas', 'FERRAMENTAS'),
    'APOIO': ('Material de apoio', 'MATERIAL_APOIO'),
    'OUTROS': ('Outros', 'OUTROS'),
}
# Mesma regra que o catálogo (services/catalogo_recursos.py) usava para separar o audiovisual
AUDIOVISUAL = {'projetores', 'caixas de som', 'microfones', 'cameras fotograficas', 'suportes para projetor'}


def _normalizar(texto):
    texto = texto.lower()
    for acento, letra in zip('áàâãéêíóôõúç', 'aaaaeeiooouc'):
        texto = texto.replace(acento, letra)
    return texto


def migrar_categorias(apps, schema_editor):
    TipoRecurso = apps.get_model('api', 'TipoRecurso')
    CategoriaRecurso = apps.get_model('api', 'CategoriaRecurso')
    criadas = {}
    for tipo in TipoRecurso.objects.all():
        chave = tipo.categoria_antiga or 'OUTROS'
        if chave == 'TECNOLOGIA' and _normalizar(tipo.descricao) in AUDIOVISUAL:
            chave = 'AUDIOVISUAL'
        nome, icone = CATEGORIAS.get(chave, CATEGORIAS['OUTROS'])
        if nome not in criadas:
            criadas[nome], _ = CategoriaRecurso.objects.get_or_create(nome=nome, defaults={'icone': icone})
        tipo.categoria = criadas[nome]
        tipo.save(update_fields=['categoria'])


def reverter_categorias(apps, schema_editor):
    TipoRecurso = apps.get_model('api', 'TipoRecurso')
    por_icone = {icone: chave for chave, (_, icone) in CATEGORIAS.items()}
    por_icone['AUDIOVISUAL'] = 'TECNOLOGIA'
    for tipo in TipoRecurso.objects.select_related('categoria'):
        tipo.categoria_antiga = por_icone.get(tipo.categoria.icone, 'OUTROS') if tipo.categoria else 'OUTROS'
        tipo.save(update_fields=['categoria_antiga'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0028_alter_notificacao_tipo_termos_operacionais'),
    ]

    operations = [
        migrations.CreateModel(
            name='CategoriaRecurso',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=50, unique=True)),
                ('icone', models.CharField(choices=[('INFORMATICA', 'Informática'), ('AUDIOVISUAL', 'Audiovisual'), ('MATERIAL_ESPORTIVO', 'Material esportivo'), ('FERRAMENTAS', 'Ferramentas'), ('MATERIAL_APOIO', 'Material de apoio'), ('OUTROS', 'Outros')], default='OUTROS', help_text='Ícone exibido no catálogo de recursos.', max_length=30)),
            ],
            options={
                'verbose_name': 'Categoria de recurso',
                'verbose_name_plural': 'Categorias de recurso',
                'db_table': 'categoria_recurso',
                'ordering': ['nome'],
            },
        ),
        migrations.RenameField(
            model_name='tiporecurso',
            old_name='categoria',
            new_name='categoria_antiga',
        ),
        migrations.AddField(
            model_name='tiporecurso',
            name='categoria',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='tipos', to='api.categoriarecurso'),
        ),
        migrations.RunPython(migrar_categorias, reverter_categorias),
        migrations.RemoveField(
            model_name='tiporecurso',
            name='categoria_antiga',
        ),
        migrations.AlterField(
            model_name='logauditoria',
            name='entidade',
            field=models.CharField(choices=[('RESERVA_AREA', 'Reserva de área'), ('RESERVA_VEICULO', 'Reserva de veículo'), ('RESERVA_RECURSO_GERAL', 'Reserva de recurso geral'), ('RECORRENCIA_RESERVA_AREA', 'Recorrência de reserva de área'), ('RECORRENCIA_RESERVA_VEICULO', 'Recorrência de reserva de veículo'), ('RECORRENCIA_RESERVA_RECURSO', 'Recorrência de reserva de recurso geral'), ('GRUPO', 'Grupo'), ('MEMBRO_GRUPO', 'Membro de grupo'), ('RECURSO_GERAL', 'Recurso geral'), ('TIPO_RECURSO', 'Tipo de recurso'), ('CATEGORIA_RECURSO', 'Categoria de recurso'), ('AREA', 'Área'), ('BLOCO', 'Bloco'), ('VEICULO', 'Veículo'), ('TIMETABLE', 'Timetable')], max_length=30, verbose_name='Entidade'),
        ),
    ]
