import uuid
from datetime import time, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.enumerations import Papel
from accounts.models.hub_user import HubUser
from api.enumerations import StatusReserva, TipoReserva
from api.enumerations.area_enumerations.area_enums import EquipamentoArea, TipoArea
from api.enumerations.bloco_enumerations.acessibilidade import Acessibilidade
from api.enumerations.categoria_recurso import CategoriaRecurso
from api.enumerations.status_recurso import StatusRecurso
from api.enumerations.tipo_recurso_reservavel import TipoRecursoReservavel
from api.enumerations.tipo_prazo import TipoPrazo
from api.models.area_model import Area
from api.models.bloco_model import Bloco
from api.models.grupo_model import Grupo
from api.models.membro_grupo_model import MembroGrupo
from api.models.recurso_geral_model import RecursoGeral
from api.models.reserva_area_model import ReservaArea
from api.models.reserva_veiculo_model import ReservaVeiculo
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

BLOCOS = [
    {
        'numero': f'{numero:02d}',
        'nome': f'Bloco {numero:02d}',
        'banheiro': True,
        'acessibilidade': [Acessibilidade.PISO_TATIL, Acessibilidade.BANHEIRO],
    }
    for numero in range(1, 6)
] + [
    {
        'numero': '06',
        'nome': 'Bloco Área de Convivência',
        'banheiro': True,
        'acessibilidade': [
            Acessibilidade.PISO_TATIL,
            Acessibilidade.BANHEIRO,
            Acessibilidade.BEBEDOURO,
        ],
    },
]

AREAS = [
    {'nome': 'Sala 101', 'bloco': '01', 'capacidade': 35, 'tipo': TipoArea.CONVENCIONAL,
     'caracteristica': 'Sala para aulas e reuniões.',
     'equipamento': [EquipamentoArea.PROJETOR, EquipamentoArea.QUADRO_BRANCO]},
    {'nome': 'Laboratório de Informática 102', 'bloco': '01', 'capacidade': 30, 'tipo': TipoArea.INFORMATICA,
     'caracteristica': 'Laboratório com computadores para atividades acadêmicas.',
     'equipamento': [EquipamentoArea.COMPUTADOR, EquipamentoArea.PROJETOR, EquipamentoArea.AR_CONDICIONADO]},
    {'nome': 'Sala 201', 'bloco': '02', 'capacidade': 40, 'tipo': TipoArea.CONVENCIONAL,
     'caracteristica': 'Sala de aula convencional.',
     'equipamento': [EquipamentoArea.PROJETOR, EquipamentoArea.QUADRO_BRANCO]},
    {'nome': 'Laboratório de Ciências 202', 'bloco': '02', 'capacidade': 24, 'tipo': TipoArea.LABORATORIO,
     'caracteristica': 'Laboratório para aulas práticas.',
     'equipamento': [EquipamentoArea.TV, EquipamentoArea.AR_CONDICIONADO]},
    {'nome': 'Sala de Música 301', 'bloco': '03', 'capacidade': 20, 'tipo': TipoArea.MUSICA,
     'caracteristica': 'Sala com tratamento acústico.',
     'equipamento': [EquipamentoArea.SISTEMA_DE_SOM, EquipamentoArea.AR_CONDICIONADO]},
    {'nome': 'Auditório 302', 'bloco': '03', 'capacidade': 120, 'tipo': TipoArea.AUDITORIO,
     'caracteristica': 'Auditório para palestras e eventos.',
     'equipamento': [EquipamentoArea.PROJETOR, EquipamentoArea.SISTEMA_DE_SOM, EquipamentoArea.AR_CONDICIONADO]},
    {'nome': 'Quadra Poliesportiva', 'bloco': '04', 'capacidade': 80, 'tipo': TipoArea.QUADRA,
     'caracteristica': 'Espaço coberto para práticas esportivas.', 'equipamento': []},
    {'nome': 'Sala 401', 'bloco': '04', 'capacidade': 30, 'tipo': TipoArea.CONVENCIONAL,
     'caracteristica': 'Sala para atividades acadêmicas.',
     'equipamento': [EquipamentoArea.QUADRO_BRANCO, EquipamentoArea.TV]},
    {'nome': 'Sala 501', 'bloco': '05', 'capacidade': 35, 'tipo': TipoArea.CONVENCIONAL,
     'caracteristica': 'Sala de aula com recursos multimídia.',
     'equipamento': [EquipamentoArea.PROJETOR, EquipamentoArea.AR_CONDICIONADO]},
    {'nome': 'Laboratório de Eletrônica 502', 'bloco': '05', 'capacidade': 25, 'tipo': TipoArea.LABORATORIO,
     'caracteristica': 'Laboratório para projetos e aulas práticas.',
     'equipamento': [EquipamentoArea.COMPUTADOR, EquipamentoArea.QUADRO_BRANCO]},
    {'nome': 'Espaço de Convivência', 'bloco': '06', 'capacidade': 100, 'tipo': TipoArea.CONVENCIONAL,
     'caracteristica': 'Espaço aberto para integração e eventos.',
     'equipamento': [EquipamentoArea.SISTEMA_DE_SOM]},
    {'nome': 'Churrasqueira', 'bloco': '06', 'capacidade': 50, 'tipo': TipoArea.CHURRASQUEIRA,
     'caracteristica': 'Área coberta para confraternizações.', 'equipamento': []},
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


def popular_blocos():
    criados = 0
    for dados in BLOCOS:
        _, criado = Bloco.objects.get_or_create(
            numero=dados['numero'],
            defaults={
                'nome': dados['nome'],
                'banheiro': dados['banheiro'],
                'acessibilidade': dados['acessibilidade'],
            },
        )
        criados += criado
    return criados


def popular_areas():
    criados = 0
    for dados in AREAS:
        bloco = Bloco.objects.get(numero=dados['bloco'])
        _, criado = Area.objects.get_or_create(
            nome=dados['nome'],
            bloco=bloco,
            defaults={
                'capacidade': dados['capacidade'],
                'caracteristica': dados['caracteristica'],
                'disponibilidade': True,
                'status': StatusRecurso.ATIVO,
                'tipo': dados['tipo'],
                'equipamento': dados['equipamento'],
            },
        )
        criados += criado
    return criados


def popular_grupo_veiculos():
    servidor = HubUser.objects.filter(
        papel=Papel.SERVIDOR,
        is_active=True,
    ).order_by('email').first()
    if not servidor:
        return 0

    hoje = timezone.localdate()
    grupo, criado = Grupo.objects.get_or_create(
        nome='Servidores autorizados para veículos',
        defaults={
            'tipo_membro_permitido': Papel.SERVIDOR,
            'tipo_recurso_autorizado': TipoRecursoReservavel.VEICULO,
            'data_inicio_validade': hoje - timedelta(days=365),
            'data_fim_validade': hoje + timedelta(days=365),
            'criador': servidor,
        },
    )

    membros_criados = 0
    for usuario in HubUser.objects.filter(papel=Papel.SERVIDOR, is_active=True):
        _, membro_criado = MembroGrupo.objects.get_or_create(
            grupo=grupo,
            usuario=usuario,
        )
        membros_criados += membro_criado
    return int(criado) + membros_criados


def usuarios_para_reservas():
    return list(
        HubUser.objects.filter(
            papel__in=[Papel.ADMIN, Papel.SERVIDOR],
            is_active=True,
        ).order_by('papel', 'email')
    )


def popular_reservas_areas():
    usuarios = usuarios_para_reservas()
    if not usuarios:
        return 0

    hoje = timezone.localdate()
    dados_reservas = [
        ('Reunião de planejamento', 'Sala 101', 0, time(16), time(18), False, StatusReserva.CONFIRMADA),
        ('Aula de programação', 'Laboratório de Informática 102', 1, time(8), time(11), True, StatusReserva.CONFIRMADA),
        ('Ensaio do grupo musical', 'Sala de Música 301', 2, time(14), time(17), False, StatusReserva.PENDENTE),
        ('Palestra institucional', 'Auditório 302', 3, time(9), time(12), False, StatusReserva.CONFIRMADA),
        ('Treino esportivo', 'Quadra Poliesportiva', 4, time(18), time(21), True, StatusReserva.CONFIRMADA),
        ('Confraternização da equipe', 'Churrasqueira', 6, time(11), time(16), False, StatusReserva.CANCELADA),
        ('Oficina de eletrônica', 'Laboratório de Eletrônica 502', -7, time(9), time(12), True, StatusReserva.CONCLUIDA),
        ('Evento de integração', 'Espaço de Convivência', 8, time(13), time(18), False, StatusReserva.REJEITADA),
    ]

    criados = 0
    for indice, (nome, area_nome, deslocamento, inicio, fim, aula, status) in enumerate(dados_reservas):
        usuario = usuarios[indice % len(usuarios)]
        area = Area.objects.get(nome=area_nome)
        _, criado = ReservaArea.objects.get_or_create(
            nome=nome,
            usuario=usuario,
            area=area,
            data=hoje + timedelta(days=deslocamento),
            defaults={
                'descricao': 'Reserva fictícia criada pelo popular_banco.',
                'horario_inicio': inicio,
                'horario_fim': fim,
                'tipo_reserva': TipoReserva.INTERNA,
                'status': status,
                'aula': aula,
            },
        )
        criados += criado
    return criados


def popular_reservas_veiculos():
    usuarios = usuarios_para_reservas()
    if not usuarios:
        return 0

    hoje = timezone.localdate()
    dados_reservas = [
        ('Viagem administrativa', 'ABC1D23', 0, time(8), 1, time(8), 'Campus Porto Alegre', 'Reunião institucional', 8, StatusReserva.CONFIRMADA),
        ('Visita técnica', 'DEF4567', 2, time(8), 2, time(18), 'Parque Tecnológico', 'Visita técnica com servidores', 4, StatusReserva.AGUARDANDO_TERMO),
        ('Atividade de campo', 'JKL8901', 3, time(7), 4, time(19), 'Estação Experimental', 'Coleta de dados de pesquisa', 5, StatusReserva.PENDENTE),
        ('Transporte para evento', 'MNO3P45', 5, time(6, 30), 5, time(22), 'Centro de Eventos', 'Participação em evento acadêmico', 18, StatusReserva.AGUARDANDO_TERMO),
        ('Reunião da direção', 'STU4V56', 7, time(9), 7, time(17), 'Reitoria', 'Reunião da equipe diretiva', 4, StatusReserva.CANCELADA),
        ('Entrega de documentos', 'DEF4567', 9, time(13), 9, time(17), 'Reitoria', 'Entrega de documentação institucional', 2, StatusReserva.REJEITADA),
        ('Viagem acadêmica concluída', 'MNO3P45', -8, time(7), -7, time(20), 'Universidade Federal', 'Participação em seminário', 16, StatusReserva.CONCLUIDA),
    ]

    criados = 0
    for indice, dados in enumerate(dados_reservas):
        (nome, placa, dia_saida, inicio, dia_retorno, fim, destino,
         finalidade, ocupantes, status) = dados
        usuario = usuarios[indice % len(usuarios)]
        veiculo = Veiculo.objects.get(placa=placa)
        reserva, criada = ReservaVeiculo.objects.get_or_create(
            nome=nome,
            usuario=usuario,
            veiculo=veiculo,
            data=hoje + timedelta(days=dia_saida),
            defaults={
                'descricao': 'Reserva fictícia criada pelo popular_banco.',
                'horario_inicio': inicio,
                'horario_fim': fim,
                'data_devolucao_prevista': hoje + timedelta(days=dia_retorno),
                'destino': destino,
                'finalidade': finalidade,
                'quantidade_passageiros': ocupantes,
            },
        )
        if criada and reserva.status != status:
            reserva.status = status
            reserva.save(update_fields=['status'])
        criados += criada
    return criados

# Acrescente aqui as próximas funções, na ordem das dependências:
# popular_blocos antes de popular_areas, por exemplo.
POPULADORES = [
    ('Usuários (alunos e servidores)', popular_usuarios),
    ('Veículos', popular_veiculos),
    ('Tipos de recurso', popular_tipos_recurso),
    ('Recursos gerais', popular_recursos_gerais),
    ('Blocos', popular_blocos),
    ('Áreas', popular_areas),
    ('Autorizações de veículos', popular_grupo_veiculos),
    ('Reservas de áreas', popular_reservas_areas),
    ('Reservas de veículos', popular_reservas_veiculos),
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
