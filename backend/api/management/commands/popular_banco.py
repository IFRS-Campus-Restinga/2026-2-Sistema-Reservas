import uuid
from datetime import time, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.enumerations import Papel
from accounts.models.hub_user import HubUser
from api.enumerations import StatusReserva, TipoReserva
from api.enumerations.categoria_recurso import CategoriaRecurso
from api.enumerations.status_recurso import StatusRecurso
from api.enumerations.tipo_recurso_reservavel import TipoRecursoReservavel
from api.enumerations.tipo_prazo import TipoPrazo
from api.enumerations.area_enumerations.area_enums import TipoArea, EquipamentoArea
from api.enumerations.bloco_enumerations.acessibilidade import Acessibilidade
from api.models.area_model import Area
from api.models.bloco_model import Bloco
from api.models.grupo_model import Grupo
from api.models.membro_grupo_model import MembroGrupo
from api.models.recorrencia_model import Recorrencia
from api.models.recurso_geral_model import RecursoGeral
from api.models.reserva_area_model import ReservaArea
from api.models.reserva_recurso_geral_model import ReservaRecursoGeral
from api.models.reserva_veiculo_model import ReservaVeiculo
from api.models.tipo_recurso_model import TipoRecurso
from api.models.veiculo_model import Veiculo
from api.enumerations.auditoria_enumerations import AcaoAuditoria
from api.services.auditoria import foto, registrar_auditoria
from api.services.autorizacao_grupo_service import salvar_autorizacoes_grupo
from api.services.notificacao_service import criar_notificacao_cancelamento, criar_notificacao_confirmacao
from hub_integrations.services.demonstracao import USUARIOS_DEMONSTRACAO, garantir_usuario_demonstracao


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
            'data_inicio_validade': hoje - timedelta(days=365),
            'data_fim_validade': hoje + timedelta(days=365),
            'criador': servidor,
        },
    )
    if criado:
        salvar_autorizacoes_grupo(grupo, [TipoRecursoReservavel.VEICULO], [])

    membros_criados = 0
    servidores = HubUser.objects.filter(
        papel=Papel.SERVIDOR,
        is_active=True,
    ).order_by('email')[:3]
    for usuario in servidores:
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



def popular_reservas_veiculos():
    usuarios = usuarios_para_reservas()
    if not usuarios:
        return 0

    hoje = timezone.localdate()
    usuario = (
        HubUser.objects.filter(email='juliarosa.sb@gmail.com', is_active=True).first()
        or usuarios[0]
    )
    dados_reservas = [
        ('Viagem administrativa', 'ABC1D23', 1, time(8), 1, time(12), 'Campus Porto Alegre', 'Reunião institucional', 8, StatusReserva.PENDENTE),
        ('Visita técnica', 'DEF4567', 3, time(14), 3, time(18), 'Parque Tecnológico', 'Visita técnica institucional', 4, StatusReserva.PENDENTE),
    ]

    criados = 0
    for dados in dados_reservas:
        (nome, placa, dia_saida, inicio, dia_retorno, fim, destino,
         finalidade, ocupantes, status) = dados
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
# popular_tipos_recurso antes de popular_recursos_gerais, por exemplo.


BLOCOS_SEED = [
    {'numero': '1', 'nome': 'Bloco 1', 'banheiro': True, 'acessibilidade': [Acessibilidade.PISO_TATIL, Acessibilidade.BANHEIRO]},
    {'numero': '3', 'nome': 'Bloco 3', 'banheiro': True, 'acessibilidade': [Acessibilidade.PISO_TATIL, Acessibilidade.BANHEIRO]},
    {'numero': '4', 'nome': 'Bloco 4', 'banheiro': True, 'acessibilidade': [Acessibilidade.PISO_TATIL]},
    {'numero': '5', 'nome': 'Bloco 5', 'banheiro': True, 'acessibilidade': [Acessibilidade.PISO_TATIL, Acessibilidade.BEBEDOURO]},
    {'numero': '7', 'nome': 'Bloco 7', 'banheiro': False, 'acessibilidade': []},
]

AREAS_SEED = [
    {'nome': '301', 'bloco': '3', 'capacidade': 35, 'tipo': TipoArea.CONVENCIONAL, 'caracteristica': 'Sala de Aula'},
    {'nome': '302', 'bloco': '3', 'capacidade': 35, 'tipo': TipoArea.CONVENCIONAL, 'caracteristica': 'Sala de Aula'},
    {'nome': '401', 'bloco': '4', 'capacidade': 30, 'tipo': TipoArea.INFORMATICA, 'caracteristica': 'Redes'},
    {'nome': '402', 'bloco': '4', 'capacidade': 30, 'tipo': TipoArea.INFORMATICA, 'caracteristica': 'Lab E'},
    {'nome': '502', 'bloco': '5', 'capacidade': 40, 'tipo': TipoArea.LABORATORIO, 'caracteristica': 'Lab de Gestão e negócios'},
    {'nome': '518', 'bloco': '5', 'capacidade': 20, 'tipo': TipoArea.MUSICA, 'caracteristica': 'Musica'},
    {'nome': '701', 'bloco': '7', 'capacidade': 25, 'tipo': TipoArea.LABORATORIO, 'caracteristica': 'Lab. Solos'},
    {'nome': 'Moodle', 'bloco': '1', 'capacidade': 0, 'tipo': TipoArea.CONVENCIONAL, 'caracteristica': 'EAD'},
]

def popular_blocos_padrao_timetable():
    criados = 0
    for dados in BLOCOS_SEED:
        _, criado = Bloco.objects.get_or_create(
            numero=dados['numero'],
            defaults={
                'nome': dados['nome'],
                'banheiro': dados['banheiro'],
                'acessibilidade': dados['acessibilidade'],
            }
        )
        criados += criado
    return criados

def popular_areas_padrao_timetable():
    criados = 0
    for dados in AREAS_SEED:
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
                'equipamento': [],
            }
        )
        criados += criado
    return criados

def limpar_areas_mock():
    # Remove blocos criados pelos mocks antigos (começam com 0 ou o fallback 99)
    # Isso também remove as áreas associadas via CASCADE
    blocos = Bloco.objects.filter(numero__in=['01', '02', '03', '04', '05', '06', '99'])

    # ReservaArea.area usa PROTECT, então as reservas dessas áreas precisam ser
    # apagadas antes; caso contrário o delete dos blocos falha e desfaz o seed inteiro.
    reservas = ReservaArea.objects.filter(area__bloco__in=blocos)
    recorrencias_ids = set(
        reservas.exclude(recorrencia__isnull=True).values_list('recorrencia_id', flat=True)
    )
    reservas_removidas, _ = reservas.delete()

    # Recorrências que ficaram sem nenhuma reserva também são descartadas.
    Recorrencia.objects.filter(id__in=recorrencias_ids, reservas__isnull=True).delete()

    removidos, _ = blocos.delete()
    return removidos + reservas_removidas

EMAIL_ALUNA_DEMONSTRACAO = USUARIOS_DEMONSTRACAO['aluno']['email']

GRUPOS_DEMONSTRACAO = [
    {
        'nome': 'Monitoria de Programação',
        'criador': 'servidor',
        'tipos': [TipoRecursoReservavel.AREA, TipoRecursoReservavel.RECURSO_GERAL],
        'tipos_recurso': ['Notebooks'],
        'tipos_recurso_apos_edicao': ['Notebooks', 'Mouses'],
        'membros': [
            EMAIL_ALUNA_DEMONSTRACAO,
            'carlos.mendes@aluno.ifrs.edu.br',
            'mariana.alves@aluno.ifrs.edu.br',
            'gabriel.oliveira@aluno.ifrs.edu.br',
        ],
        'membros_removidos': ['gabriel.oliveira@aluno.ifrs.edu.br'],
    },
    {
        'nome': 'Equipe de Robótica',
        'criador': 'admin',
        'tipos': [TipoRecursoReservavel.AREA, TipoRecursoReservavel.RECURSO_GERAL],
        'tipos_recurso': ['Projetores', 'Caixas de som'],
        'membros': [EMAIL_ALUNA_DEMONSTRACAO, 'lucas.fernandes@aluno.ifrs.edu.br'],
    },
    {
        'nome': 'Esportes no intervalo',
        'criador': 'servidor',
        'tipos': [TipoRecursoReservavel.RECURSO_GERAL],
        'tipos_recurso': ['Bolas', 'Redes de vôlei'],
        'membros': ['pedro.souza@aluno.ifrs.edu.br', 'julia.martins@aluno.ifrs.edu.br'],
    },
]

RESERVAS_AREA_DEMONSTRACAO = [
    ('admin', 'Reunião de coordenação', '301', '3', 1, time(9), time(11), StatusReserva.CONFIRMADA),
    ('servidor', 'Aula de reforço de Algoritmos', '402', '4', 2, time(14), time(16), StatusReserva.CONFIRMADA),
    ('servidor', 'Banca de TCC', '502', '5', 5, time(19), time(21), StatusReserva.CONFIRMADA),
    ('aluno', 'Estudo em grupo de Programação', '401', '4', 3, time(10), time(12), StatusReserva.CONFIRMADA),
    ('aluno', 'Treino da equipe de robótica', '701', '7', 6, time(13), time(17), StatusReserva.CONFIRMADA),
    ('aluno', 'Revisão para a prova de Cálculo', '301', '3', -4, time(15), time(17), StatusReserva.CONFIRMADA),
    ('aluno', 'Ensaio da apresentação do projeto', '302', '3', 2, time(8), time(10), StatusReserva.CONFIRMADA),
]

RESERVAS_RECURSO_DEMONSTRACAO = [
    ('aluno', 'Notebook para monitoria', 'Notebook Dell', 3, time(10), time(12), StatusReserva.CONFIRMADA),
    ('aluno', 'Mouse para monitoria', 'Mouse USB', 3, time(10), time(12), StatusReserva.CONFIRMADA),
    ('servidor', 'Projetor para aula de reforço', 'Projetor Epson', 2, time(14), time(16), StatusReserva.CONFIRMADA),
]

RESERVA_CANCELADA_PELA_ADMIN = 'Ensaio da apresentação do projeto'
MOTIVO_CANCELAMENTO_DEMONSTRACAO = 'A sala será usada em um evento institucional.'


def _tipos_recurso(descricoes):
    return list(TipoRecurso.objects.filter(descricao__in=descricoes))


def _criar_grupo_demonstracao(dados, usuarios, hoje):
    criador = usuarios[dados['criador']]
    grupo, criado = Grupo.objects.get_or_create(
        nome=dados['nome'],
        criador=criador,
        defaults={
            'tipo_membro_permitido': Papel.ALUNO,
            'data_inicio_validade': hoje - timedelta(days=30),
            'data_fim_validade': hoje + timedelta(days=180),
        },
    )
    if not criado:
        return 0

    salvar_autorizacoes_grupo(grupo, dados['tipos'], _tipos_recurso(dados['tipos_recurso']))
    registrar_auditoria(criador, AcaoAuditoria.CRIAR, grupo, depois=foto(grupo))
    criados = 1

    for usuario in HubUser.objects.filter(email__in=dados['membros']):
        membro = MembroGrupo.objects.create(grupo=grupo, usuario=usuario)
        registrar_auditoria(criador, AcaoAuditoria.CRIAR, membro, depois=foto(membro))
        criados += 1

    if 'tipos_recurso_apos_edicao' in dados:
        antes = foto(grupo)
        salvar_autorizacoes_grupo(grupo, dados['tipos'], _tipos_recurso(dados['tipos_recurso_apos_edicao']))
        registrar_auditoria(criador, AcaoAuditoria.EDITAR, grupo, antes=antes, depois=foto(grupo))

    for membro in grupo.membros.filter(usuario__email__in=dados.get('membros_removidos', [])):
        registrar_auditoria(criador, AcaoAuditoria.EXCLUIR, membro, antes=foto(membro))
        membro.delete()

    return criados


def _adicionar_servidor_ao_grupo_veiculos(usuarios):
    grupo = Grupo.objects.filter(nome='Servidores autorizados para veículos').first()
    if not grupo:
        return 0
    membro, criado = MembroGrupo.objects.get_or_create(grupo=grupo, usuario=usuarios['servidor'])
    if criado:
        registrar_auditoria(usuarios['admin'], AcaoAuditoria.CRIAR, membro, depois=foto(membro))
    return int(criado)


def _finalizar_reserva_demonstracao(reserva, status, usuarios):
    if reserva.status != status:
        reserva.status = status
        reserva.save(update_fields=['status'])
    if status == StatusReserva.CONFIRMADA and reserva.usuario != usuarios['admin']:
        criar_notificacao_confirmacao(reserva)
    if reserva.nome == RESERVA_CANCELADA_PELA_ADMIN:
        antes = foto(reserva)
        reserva.status = StatusReserva.CANCELADA
        reserva.motivo_cancelamento = MOTIVO_CANCELAMENTO_DEMONSTRACAO
        reserva.cancelada_em = timezone.now()
        reserva.cancelada_por = usuarios['admin']
        reserva.save(update_fields=['status', 'motivo_cancelamento', 'cancelada_em', 'cancelada_por'])
        registrar_auditoria(usuarios['admin'], AcaoAuditoria.CANCELAR, reserva, antes=antes, depois=foto(reserva))
        criar_notificacao_cancelamento(reserva)


def _criar_reservas_area_demonstracao(usuarios, hoje):
    criados = 0
    for perfil, nome, area_nome, bloco_numero, dias, inicio, fim, status in RESERVAS_AREA_DEMONSTRACAO:
        area = Area.objects.filter(nome=area_nome, bloco__numero=bloco_numero).first()
        if not area:
            continue
        reserva, criada = ReservaArea.objects.get_or_create(
            nome=nome,
            usuario=usuarios[perfil],
            defaults={
                'descricao': 'Reserva de demonstração criada pelo popular_banco.',
                'area': area,
                'data': hoje + timedelta(days=dias),
                'horario_inicio': inicio,
                'horario_fim': fim,
                'tipo_reserva': TipoReserva.INTERNA,
                'status': status,
            },
        )
        if criada:
            _finalizar_reserva_demonstracao(reserva, status, usuarios)
        criados += criada
    return criados


def _criar_reservas_recurso_demonstracao(usuarios, hoje):
    criados = 0
    for perfil, nome, recurso_nome, dias, inicio, fim, status in RESERVAS_RECURSO_DEMONSTRACAO:
        recurso = RecursoGeral.objects.filter(nome=recurso_nome).first()
        if not recurso:
            continue
        reserva, criada = ReservaRecursoGeral.objects.get_or_create(
            nome=nome,
            usuario=usuarios[perfil],
            defaults={
                'descricao': 'Reserva de demonstração criada pelo popular_banco.',
                'recurso_geral': recurso,
                'data': hoje + timedelta(days=dias),
                'horario_inicio': inicio,
                'horario_fim': fim,
                'data_devolucao_prevista': hoje + timedelta(days=dias),
                'quantidades': 1,
                'tipo_reserva': TipoReserva.INTERNA,
            },
        )
        if criada and not recurso.tem_termo_de_responsabilidade:
            _finalizar_reserva_demonstracao(reserva, status, usuarios)
        criados += criada
    return criados


def _criar_reserva_veiculo_demonstracao(usuarios, hoje):
    veiculo = Veiculo.objects.filter(placa='ABC1D23').first()
    if not veiculo:
        return 0
    _, criada = ReservaVeiculo.objects.get_or_create(
        nome='Visita técnica com turma',
        usuario=usuarios['servidor'],
        defaults={
            'descricao': 'Reserva de demonstração criada pelo popular_banco.',
            'veiculo': veiculo,
            'data': hoje + timedelta(days=4),
            'horario_inicio': time(8),
            'horario_fim': time(17),
            'data_devolucao_prevista': hoje + timedelta(days=4),
            'destino': 'Parque Tecnológico',
            'finalidade': 'Visita técnica com alunos',
            'quantidade_passageiros': 4,
        },
    )
    return int(criada)


def popular_demonstracao():
    usuarios = {perfil: garantir_usuario_demonstracao(perfil) for perfil in USUARIOS_DEMONSTRACAO}
    hoje = timezone.localdate()

    criados = sum(_criar_grupo_demonstracao(dados, usuarios, hoje) for dados in GRUPOS_DEMONSTRACAO)
    criados += _adicionar_servidor_ao_grupo_veiculos(usuarios)
    criados += _criar_reservas_area_demonstracao(usuarios, hoje)
    criados += _criar_reservas_recurso_demonstracao(usuarios, hoje)
    criados += _criar_reserva_veiculo_demonstracao(usuarios, hoje)
    return criados

POPULADORES = [
    ('Usuários (alunos e servidores)', popular_usuarios),
    ('Veículos', popular_veiculos),
    ('Tipos de recurso', popular_tipos_recurso),
    ('Recursos gerais', popular_recursos_gerais),
    ('Autorizações de veículos', popular_grupo_veiculos),
    ('Reservas de veículos', popular_reservas_veiculos),
    ('Blocos (Padrão Timetable)', popular_blocos_padrao_timetable),
    ('Áreas (Padrão Timetable)', popular_areas_padrao_timetable),
    ('Dados de demonstração', popular_demonstracao),
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
        parser.add_argument(
            '--sincronizar-timetable',
            action='store_true',
            help='Sincroniza os horários, salas, aulas e gera as reservas de área da Timetable do EduPage.',
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

        

        # Limpeza automática de blocos com zero à esquerda (legado) antes de popular os novos
        removidos_legado = limpar_areas_mock()
        if removidos_legado > 0:
            self.stdout.write(self.style.WARNING(f'Migração: {removidos_legado} blocos/áreas/reservas do formato antigo foram limpos automaticamente.'))


        if options['limpar_tipos_antigos']:
            removidos, mantidos = limpar_tipos_antigos()
            self.stdout.write(self.style.SUCCESS(
                f'Tipos antigos: {removidos} removido(s), {mantidos} preservado(s) por ainda ter recursos.'
            ))

        if options['sincronizar_timetable']:
            from django.core.management import call_command
            self.stdout.write(self.style.WARNING('\nSincronizando Timetable com EduPage e gerando reservas de área...'))
            call_command('sincronizar_timetable')
