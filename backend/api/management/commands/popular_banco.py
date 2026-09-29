import uuid

from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.enumerations import Papel
from accounts.models.hub_user import HubUser
from api.enumerations.categoria_recurso import CategoriaRecurso
from api.enumerations.status_recurso import StatusRecurso
from api.enumerations.tipo_prazo import TipoPrazo
from api.models.recurso_geral_model import RecursoGeral
from api.models.tipo_recurso_model import TipoRecurso
from api.models.veiculo_model import Veiculo


ALUNOS = [
    {'nome': 'Carlos Mendes', 'email': 'carlos.mendes@aluno.ifrs.edu.br'},
    {'nome': 'Beatriz Rocha', 'email': 'beatriz.rocha@aluno.ifrs.edu.br'},
    {'nome': 'Lucas Fernandes', 'email': 'lucas.fernandes@aluno.ifrs.edu.br'},
    {'nome': 'Mariana Alves', 'email': 'mariana.alves@aluno.ifrs.edu.br'},
    {'nome': 'Pedro Henrique Souza', 'email': 'pedro.souza@aluno.ifrs.edu.br'},
    {'nome': 'Júlia Martins', 'email': 'julia.martins@aluno.ifrs.edu.br'},
    {'nome': 'Gabriel Oliveira', 'email': 'gabriel.oliveira@aluno.ifrs.edu.br'},
    {'nome': 'Larissa Costa', 'email': 'larissa.costa@aluno.ifrs.edu.br'},
    {'nome': 'Rafael Santos', 'email': 'rafael.santos@aluno.ifrs.edu.br'},
    {'nome': 'Camila Barbosa', 'email': 'camila.barbosa@aluno.ifrs.edu.br'},
    {'nome': 'Fernando Azevedo', 'email': 'fernando.azevedo@aluno.ifrs.edu.br'},
    {'nome': 'Isabela Cunha', 'email': 'isabela.cunha@aluno.ifrs.edu.br'},
    {'nome': 'Thiago Moraes', 'email': 'thiago.moraes@aluno.ifrs.edu.br'},
    {'nome': 'Amanda Ribeiro', 'email': 'amanda.ribeiro@aluno.ifrs.edu.br'},
    {'nome': 'Vinícius Teixeira', 'email': 'vinicius.teixeira@aluno.ifrs.edu.br'},
]

SERVIDORES = [
    {'nome': 'João Silva', 'email': 'joao.silva@ifrs.edu.br'},
    {'nome': 'Ana Costa', 'email': 'ana.costa@ifrs.edu.br'},
    {'nome': 'Marcos Pereira', 'email': 'marcos.pereira@ifrs.edu.br'},
    {'nome': 'Fernanda Lima', 'email': 'fernanda.lima@ifrs.edu.br'},
    {'nome': 'Ricardo Nunes', 'email': 'ricardo.nunes@ifrs.edu.br'},
    {'nome': 'Patrícia Gomes', 'email': 'patricia.gomes@ifrs.edu.br'},
    {'nome': 'Eduardo Ramos', 'email': 'eduardo.ramos@ifrs.edu.br'},
    {'nome': 'Sandra Lima', 'email': 'sandra.lima@ifrs.edu.br'},
    {'nome': 'Tiago Cardoso', 'email': 'tiago.cardoso@ifrs.edu.br'},
    {'nome': 'Renata Dias', 'email': 'renata.dias@ifrs.edu.br'},
    {'nome': 'Cristina Borges', 'email': 'cristina.borges@ifrs.edu.br'},
    {'nome': 'Rodrigo Farias', 'email': 'rodrigo.farias@ifrs.edu.br'},
    {'nome': 'Vanessa Correia', 'email': 'vanessa.correia@ifrs.edu.br'},
    {'nome': 'Leonardo Machado', 'email': 'leonardo.machado@ifrs.edu.br'},
    {'nome': 'Simone Castro', 'email': 'simone.castro@ifrs.edu.br'},
]

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

def popular_usuarios():
    criados = 0
    for lista, papel in ((ALUNOS, Papel.ALUNO), (SERVIDORES, Papel.SERVIDOR)):
        for dados in lista:
            _, criado = HubUser.objects.get_or_create(
                email=dados['email'],
                defaults={'id': uuid.uuid4(), 'nome': dados['nome'], 'papel': papel, 'is_active': True},
            )
            criados += criado
    return criados

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

    for dados in RECURSOS_GERAIS:
        if RecursoGeral.objects.filter(codigo=dados['codigo']).exists():
            continue

        tipo_recurso = TipoRecurso.objects.get(descricao=dados['tipo'])

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

    return criados


def reclassificar_recursos_gerais():
    reclassificados = 0

    for dados in RECURSOS_GERAIS:
        recurso = RecursoGeral.objects.filter(codigo=dados['codigo']).first()
        tipo_recurso = TipoRecurso.objects.get(descricao=dados['tipo'])

        if recurso and recurso.tipo_recurso_id != tipo_recurso.id:
            recurso.tipo_recurso = tipo_recurso
            recurso.full_clean()
            recurso.save(update_fields=['tipo_recurso'])
            reclassificados += 1

    return reclassificados

# Acrescente aqui as próximas funções, na ordem das dependências:
# popular_blocos antes de popular_areas, por exemplo.
POPULADORES = [
    ('Usuários (alunos e servidores)', popular_usuarios),
    ('Veículos', popular_veiculos),
    ('Tipos de recurso', popular_tipos_recurso),
    ('Recursos gerais', popular_recursos_gerais),
]


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
    help = 'Popula o banco com dados fictícios, preservando registros existentes.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limpar-tipos-antigos',
            action='store_true',
            help='Remove os cinco tipos amplos antigos sem recursos associados.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        for nome, popular in POPULADORES:
            quantidade = popular()
            self.stdout.write(self.style.SUCCESS(
                f'{nome}: {quantidade} registro(s) criado(s).'
            ))

        reclassificados = reclassificar_recursos_gerais()
        self.stdout.write(self.style.SUCCESS(
            f'Recursos gerais da base antiga: {reclassificados} reclassificado(s).'
        ))

        if options['limpar_tipos_antigos']:
            removidos, mantidos = limpar_tipos_antigos()
            self.stdout.write(self.style.SUCCESS(
                f'Tipos antigos: {removidos} removido(s), {mantidos} preservado(s) por ainda ter recursos.'
            ))
