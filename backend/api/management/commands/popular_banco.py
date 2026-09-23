from django.core.management.base import BaseCommand
from django.db import transaction

from api.enumerations.categoria_recurso import CategoriaRecurso
from api.enumerations.status_recurso import StatusRecurso
from api.enumerations.tipo_prazo import TipoPrazo
from api.models.recurso_geral_model import RecursoGeral
from api.models.tipo_recurso_model import TipoRecurso
from api.models.veiculo_model import Veiculo


VEICULOS = [
    {
        'nome': 'Van do Campus',
        'placa': 'ABC1D23',
        'marca': 'Renault',
        'modelo': 'Master',
        'capacidade': 16,
        'combustivel': 'Diesel',
        'quilometragem': 42500,
        'cor': 'Branco',
        'observacao': 'Transporte de estudantes.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Carro Administrativo',
        'placa': 'DEF4567',
        'marca': 'Chevrolet',
        'modelo': 'Onix',
        'capacidade': 5,
        'combustivel': 'Flex',
        'quilometragem': 18000,
        'cor': 'Prata',
        'observacao': 'Deslocamentos administrativos.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Van de Apoio',
        'placa': 'GHI2J34',
        'marca': 'Fiat',
        'modelo': 'Ducato',
        'capacidade': 15,
        'combustivel': 'Diesel',
        'quilometragem': 76000,
        'cor': 'Branco',
        'observacao': 'Revisão periódica.',
        'status': StatusRecurso.MANUTENCAO,
    },
    {
        'nome': 'Caminhonete de Campo',
        'placa': 'JKL8901',
        'marca': 'Toyota',
        'modelo': 'Hilux',
        'capacidade': 5,
        'combustivel': 'Diesel',
        'quilometragem': 31500,
        'cor': 'Cinza',
        'observacao': 'Atividades de campo.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Micro-ônibus Escolar',
        'placa': 'MNO3P45',
        'marca': 'Mercedes-Benz',
        'modelo': 'Sprinter',
        'capacidade': 20,
        'combustivel': 'Diesel',
        'quilometragem': 95000,
        'cor': 'Amarelo',
        'observacao': 'Visitas técnicas e eventos.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Carro de Apoio',
        'placa': 'PQR2345',
        'marca': 'Volkswagen',
        'modelo': 'Gol',
        'capacidade': 5,
        'combustivel': 'Flex',
        'quilometragem': 128000,
        'cor': 'Vermelho',
        'observacao': 'Fora de operação.',
        'status': StatusRecurso.INATIVO,
    },
    {
        'nome': 'Sedan da Direção',
        'placa': 'STU4V56',
        'marca': 'Toyota',
        'modelo': 'Corolla',
        'capacidade': 5,
        'combustivel': 'Flex',
        'quilometragem': 24000,
        'cor': 'Preto',
        'observacao': '',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Utilitário de Manutenção',
        'placa': 'VWX6789',
        'marca': 'Fiat',
        'modelo': 'Fiorino',
        'capacidade': 2,
        'combustivel': 'Flex',
        'quilometragem': 58000,
        'cor': 'Branco',
        'observacao': 'Transporte de ferramentas.',
        'status': StatusRecurso.MANUTENCAO,
    },
]

TIPOS_RECURSO = {
    'Notebooks': CategoriaRecurso.TECNOLOGIA,
    'Mouses': CategoriaRecurso.TECNOLOGIA,
    'Teclados': CategoriaRecurso.TECNOLOGIA,
    'Projetores': CategoriaRecurso.TECNOLOGIA,
    'Caixas de som': CategoriaRecurso.TECNOLOGIA,
    'Microfones': CategoriaRecurso.TECNOLOGIA,
    'Câmeras fotográficas': CategoriaRecurso.TECNOLOGIA,
    'Bolas': CategoriaRecurso.ESPORTES,
    'Redes de vôlei': CategoriaRecurso.ESPORTES,
    'Cones': CategoriaRecurso.ESPORTES,
    'Furadeiras': CategoriaRecurso.MANUTENCAO,
    'Caixas de ferramentas': CategoriaRecurso.MANUTENCAO,
    'Extensões elétricas': CategoriaRecurso.APOIO,
    'Suportes para projetor': CategoriaRecurso.TECNOLOGIA,
}


RECURSOS_GERAIS = [
    {
        'nome': 'Notebook Dell',
        'tipo': 'Notebooks',
        'codigo': 'INF001',
        'tipo_prazo': TipoPrazo.CURTO_PRAZO,
        'quantidade_total': 10,
        'tem_termo_de_responsabilidade': True,
        'observacao': 'Uso em atividades acadêmicas.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Notebook Lenovo',
        'tipo': 'Notebooks',
        'codigo': 'INF002',
        'tipo_prazo': TipoPrazo.CURTO_PRAZO,
        'quantidade_total': 8,
        'tem_termo_de_responsabilidade': True,
        'observacao': 'Uso em aulas e projetos.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Mouse USB',
        'tipo': 'Mouses',
        'codigo': 'INF003',
        'tipo_prazo': TipoPrazo.CURTO_PRAZO,
        'quantidade_total': 20,
        'tem_termo_de_responsabilidade': False,
        'observacao': 'Periférico para computadores.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Teclado USB',
        'tipo': 'Teclados',
        'codigo': 'INF004',
        'tipo_prazo': TipoPrazo.CURTO_PRAZO,
        'quantidade_total': 15,
        'tem_termo_de_responsabilidade': False,
        'observacao': 'Periférico para computadores.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Projetor Epson',
        'tipo': 'Projetores',
        'codigo': 'AUD001',
        'tipo_prazo': TipoPrazo.CURTO_PRAZO,
        'quantidade_total': 6,
        'tem_termo_de_responsabilidade': True,
        'observacao': 'Uso em apresentações.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Caixa de Som',
        'tipo': 'Caixas de som',
        'codigo': 'AUD002',
        'tipo_prazo': TipoPrazo.CURTO_PRAZO,
        'quantidade_total': 4,
        'tem_termo_de_responsabilidade': True,
        'observacao': 'Uso em eventos internos.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Microfone sem Fio',
        'tipo': 'Microfones',
        'codigo': 'AUD003',
        'tipo_prazo': TipoPrazo.CURTO_PRAZO,
        'quantidade_total': 5,
        'tem_termo_de_responsabilidade': True,
        'observacao': 'Uso em palestras e eventos.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Câmera Fotográfica',
        'tipo': 'Câmeras fotográficas',
        'codigo': 'AUD004',
        'tipo_prazo': TipoPrazo.CURTO_PRAZO,
        'quantidade_total': 3,
        'tem_termo_de_responsabilidade': True,
        'observacao': 'Registro de atividades.',
        'status': StatusRecurso.MANUTENCAO,
    },
    {
        'nome': 'Bola de Futsal',
        'tipo': 'Bolas',
        'codigo': 'ESP001',
        'tipo_prazo': TipoPrazo.CURTO_PRAZO,
        'quantidade_total': 12,
        'tem_termo_de_responsabilidade': False,
        'observacao': 'Uso na quadra esportiva.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Bola de Vôlei',
        'tipo': 'Bolas',
        'codigo': 'ESP002',
        'tipo_prazo': TipoPrazo.CURTO_PRAZO,
        'quantidade_total': 10,
        'tem_termo_de_responsabilidade': False,
        'observacao': 'Uso em aulas de educação física.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Rede de Vôlei',
        'tipo': 'Redes de vôlei',
        'codigo': 'ESP003',
        'tipo_prazo': TipoPrazo.CURTO_PRAZO,
        'quantidade_total': 3,
        'tem_termo_de_responsabilidade': False,
        'observacao': 'Material para a quadra.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Kit de Cones',
        'tipo': 'Cones',
        'codigo': 'ESP004',
        'tipo_prazo': TipoPrazo.CURTO_PRAZO,
        'quantidade_total': 6,
        'tem_termo_de_responsabilidade': False,
        'observacao': 'Treinos e atividades esportivas.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Furadeira',
        'tipo': 'Furadeiras',
        'codigo': 'FER001',
        'tipo_prazo': TipoPrazo.LONGO_PRAZO,
        'quantidade_total': 4,
        'tem_termo_de_responsabilidade': True,
        'observacao': 'Uso da equipe de manutenção.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Caixa de Ferramentas',
        'tipo': 'Caixas de ferramentas',
        'codigo': 'FER002',
        'tipo_prazo': TipoPrazo.LONGO_PRAZO,
        'quantidade_total': 5,
        'tem_termo_de_responsabilidade': True,
        'observacao': 'Uso da manutenção predial.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Extensão Elétrica',
        'tipo': 'Extensões elétricas',
        'codigo': 'APO001',
        'tipo_prazo': TipoPrazo.CURTO_PRAZO,
        'quantidade_total': 12,
        'tem_termo_de_responsabilidade': False,
        'observacao': 'Apoio em salas e eventos.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Suporte para Projetor',
        'tipo': 'Suportes para projetor',
        'codigo': 'APO002',
        'tipo_prazo': TipoPrazo.CURTO_PRAZO,
        'quantidade_total': 4,
        'tem_termo_de_responsabilidade': False,
        'observacao': 'Apoio para apresentações.',
        'status': StatusRecurso.INATIVO,
    },
    {
        'nome': 'Projetor BenQ',
        'tipo': 'Projetores',
        'codigo': 'AUD005',
        'tipo_prazo': TipoPrazo.CURTO_PRAZO,
        'quantidade_total': 4,
        'tem_termo_de_responsabilidade': True,
        'observacao': 'Uso em salas e auditórios.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Projetor LG',
        'tipo': 'Projetores',
        'codigo': 'AUD006',
        'tipo_prazo': TipoPrazo.CURTO_PRAZO,
        'quantidade_total': 2,
        'tem_termo_de_responsabilidade': True,
        'observacao': 'Uso em apresentações.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Caixa de Som Portátil',
        'tipo': 'Caixas de som',
        'codigo': 'AUD007',
        'tipo_prazo': TipoPrazo.CURTO_PRAZO,
        'quantidade_total': 3,
        'tem_termo_de_responsabilidade': True,
        'observacao': 'Eventos e atividades internas.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Microfone com Fio',
        'tipo': 'Microfones',
        'codigo': 'AUD008',
        'tipo_prazo': TipoPrazo.CURTO_PRAZO,
        'quantidade_total': 6,
        'tem_termo_de_responsabilidade': False,
        'observacao': 'Uso em palestras e eventos.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Bola de Futebol de Campo',
        'tipo': 'Bolas',
        'codigo': 'ESP005',
        'tipo_prazo': TipoPrazo.CURTO_PRAZO,
        'quantidade_total': 8,
        'tem_termo_de_responsabilidade': False,
        'observacao': 'Uso no campo de futebol.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Bola de Futebol Society',
        'tipo': 'Bolas',
        'codigo': 'ESP006',
        'tipo_prazo': TipoPrazo.CURTO_PRAZO,
        'quantidade_total': 7,
        'tem_termo_de_responsabilidade': False,
        'observacao': 'Uso na quadra society.',
        'status': StatusRecurso.ATIVO,
    },
]


def popular_veiculos():
    criados = 0
    for dados in VEICULOS:
        if Veiculo.objects.filter(placa=dados['placa']).exists():
            continue
        veiculo = Veiculo(**dados)
        veiculo.full_clean()
        veiculo.save()
        criados += 1
    return criados

def popular_tipos_recurso():
    criados = 0
    for descricao, categoria in TIPOS_RECURSO.items():
        tipo, criado = TipoRecurso.objects.get_or_create(
            descricao=descricao,
            defaults={'categoria': categoria},
        )
        if criado:
            criados += 1
        elif tipo.categoria != categoria:
            tipo.categoria = categoria
            tipo.save(update_fields=['categoria'])
    return criados


def popular_recursos_gerais():
    criados = 0
    reclassificados = 0

    for dados in RECURSOS_GERAIS:
        tipo_recurso = TipoRecurso.objects.get(descricao=dados['tipo'])
        recurso = RecursoGeral.objects.filter(codigo=dados['codigo']).first()

        if recurso:
            # Na base antiga, atualiza apenas o tipo. Preserva reservas e outras alterações.
            if recurso.tipo_recurso_id != tipo_recurso.id:
                recurso.tipo_recurso = tipo_recurso
                recurso.full_clean()
                recurso.save(update_fields=['tipo_recurso'])
                reclassificados += 1
            continue

        recurso = RecursoGeral(
            nome=dados['nome'],
            tipo_recurso=tipo_recurso,
            codigo=dados['codigo'],
            tipo_prazo=dados['tipo_prazo'],
            quantidade_total=dados['quantidade_total'],
            quantidade_reservada=0,
            tem_termo_de_responsabilidade=dados['tem_termo_de_responsabilidade'],
            observacao=dados['observacao'],
            status=dados['status'],
        )
        recurso.full_clean()
        recurso.save()
        criados += 1

    return criados, reclassificados


def limpar_tipos_antigos():
    antigos = [
        'Informática',
        'Audiovisual',
        'Material esportivo',
        'Ferramentas',
        'Material de apoio',
    ]
    removidos = 0
    mantidos = 0

    for tipo in TipoRecurso.objects.filter(descricao__in=antigos):
        # Não elimina tipos que ainda estejam ligados a outros recursos cadastrados.
        if tipo.recursos.exists():
            mantidos += 1
        else:
            tipo.delete()
            removidos += 1

    return removidos, mantidos


class Command(BaseCommand):
    help = 'Popula o banco com veículos, tipos específicos e recursos gerais.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limpar-tipos-antigos',
            action='store_true',
            help='Remove os cinco tipos amplos antigos sem recursos associados.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        veiculos = popular_veiculos()
        tipos = popular_tipos_recurso()
        recursos, reclassificados = popular_recursos_gerais()

        self.stdout.write(self.style.SUCCESS(f'Veículos: {veiculos} criado(s).'))
        self.stdout.write(self.style.SUCCESS(f'Tipos específicos: {tipos} criado(s).'))
        self.stdout.write(self.style.SUCCESS(
            f'Recursos gerais: {recursos} criado(s), {reclassificados} reclassificado(s).'
        ))

        if options['limpar_tipos_antigos']:
            removidos, mantidos = limpar_tipos_antigos()
            self.stdout.write(self.style.SUCCESS(
                f'Tipos antigos: {removidos} removido(s), {mantidos} preservado(s) por ainda ter recursos.'
            ))
