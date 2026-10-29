import hashlib
import json
import tempfile
import uuid
from datetime import date, time, timedelta
from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from accounts.enumerations import Papel
from accounts.models.hub_user import HubUser
from api.enumerations import StatusReserva, TipoReserva
from api.enumerations.auditoria_enumerations import AcaoAuditoria, EntidadeAuditoria
from api.enumerations.categoria_recurso import CategoriaRecurso
from api.enumerations.status_termo import StatusTermo
from api.enumerations.tipo_notificacao import TipoNotificacao
from api.enumerations.tipo_prazo import TipoPrazo
from api.enumerations.tipo_termo import TipoTermo
from api.models.area_model import Area
from api.models.autorizacao_grupo_model import AutorizacaoGrupo
from api.models.bloco_model import Bloco
from api.models.grupo_model import Grupo
from api.models.log_auditoria_model import LogAuditoria
from api.models.membro_grupo_model import MembroGrupo
from api.models.notificacao_model import Notificacao
from api.models.recurso_geral_model import RecursoGeral
from api.models.reserva_area_model import ReservaArea
from api.models.reserva_recurso_geral_model import ReservaRecursoGeral
from api.models.reserva_veiculo_model import ReservaVeiculo
from api.models.termo_responsabilidade_model import TermoResponsabilidade
from api.models.tipo_recurso_model import TipoRecurso
from api.models.veiculo_model import Veiculo

QUANTIDADE_POR_LISTA = 21
NOMES_PESSOAS = [
    'Marina Valente', 'Caio Nogueira', 'Lívia Monteiro', 'Rafael Siqueira',
    'Joana Figueiredo', 'Davi Albuquerque', 'Helena Prado', 'Ícaro Menezes',
    'Sofia Tavares', 'Breno Azevedo', 'Camila Furtado', 'Tomás Peixoto',
    'Isabela Noronha', 'Miguel Dantas', 'Alice Vasconcelos', 'Enzo Cardoso',
    'Luana Pacheco', 'André Queiroz', 'Cecília Barros', 'Vitor Lacerda',
    'Manuela Freire',
]
NOMES_BLOCOS = [
    'Pavilhão das Araucárias', 'Edifício Horizonte', 'Anexo Campo Claro',
    'Centro Cultural do Vale', 'Pavilhão Nascente', 'Casa das Pitangueiras',
    'Núcleo Pedra Branca', 'Edifício das Andorinhas', 'Pavilhão Serra Azul',
    'Casa do Ipê Amarelo', 'Centro das Águas', 'Anexo Riacho Doce',
    'Pavilhão Monte Verde', 'Edifício Candeia', 'Núcleo Vale Sereno',
    'Casa da Brisa Sul', 'Centro dos Manacás', 'Pavilhão Lago Azul',
    'Anexo das Quaresmeiras', 'Edifício Vento Leste', 'Núcleo Fonte Nova',
]
NOMES_AREAS = [
    'Auditório das Pitangueiras', 'Sala Nascente', 'Laboratório Maré Alta',
    'Ateliê Cata-Vento', 'Sala Limoeiro', 'Pátio das Quaresmeiras',
    'Estúdio Pedra Clara', 'Biblioteca das Andorinhas', 'Sala Riacho Doce',
    'Oficina Ipê Branco', 'Laboratório Campo Verde', 'Sala Brisa Serena',
    'Auditório Vale Azul', 'Ateliê das Candeias', 'Sala Monte Belo',
    'Estúdio Lago Dourado', 'Pátio das Acácias', 'Sala Vento Sul',
    'Laboratório Fonte Clara', 'Biblioteca do Cedro', 'Sala Horizonte Aberto',
]
NOMES_VEICULOS = [
    'Van Serra Clara', 'Sedã Vale Sereno', 'Micro-ônibus Ipê', 'Utilitário Horizonte',
    'Van Riacho Doce', 'Sedã Campo Verde', 'Minivan Pedra Branca', 'Utilitário Nascente',
    'Van Lago Azul', 'Sedã Brisa Sul', 'Micro-ônibus Candeia', 'Van Monte Belo',
    'Utilitário Andorinha', 'Sedã Fonte Nova', 'Van Quaresmeiras', 'Minivan Cedro Alto',
    'Utilitário Vento Leste', 'Sedã Pitangueiras', 'Van Manacá', 'Micro-ônibus Aurora',
    'Utilitário Maré Mansa',
]
NOMES_GRUPOS = [
    'Coletivo Caderno Aberto', 'Equipe Raiz do Sul', 'Núcleo Roda de Leitura',
    'Coletivo Janelas do Vale', 'Equipe Caminhos da Serra', 'Núcleo Mãos à Obra',
    'Coletivo Ponto de Encontro', 'Equipe Sementes do Amanhã', 'Núcleo Vozes da Vila',
    'Coletivo Trilhas do Saber', 'Equipe Horizonte Vivo', 'Núcleo Arte na Praça',
    'Coletivo Vizinhança Atenta', 'Equipe Rede de Afeto', 'Núcleo Estação Criativa',
    'Coletivo Ponte das Ideias', 'Equipe Quintal Compartilhado', 'Núcleo Farol Aceso',
    'Coletivo Varanda Cultural', 'Equipe Mapa das Descobertas', 'Núcleo Casa Aberta',
]
NOMES_TIPOS = [
    'Câmera Andorinha', 'Microfone Vale Azul', 'Caixa Candeia', 'Projetor Horizonte',
    'Gravador Nascente', 'Tripé Serra Clara', 'Lente Campo Verde', 'Tablet Ipê Branco',
    'Roteador Pedra Alta', 'Iluminador Brisa Sul', 'Tela Arco-Íris', 'Kit Cabos Sabiá',
    'Scanner Fonte Nova', 'Teclado Cedro', 'Bola Riacho Doce', 'Rede Campo Alto',
    'Cones Vale Verde', 'Colchonete Lago Azul', 'Chave Serra Dourada',
    'Alicate Monte Azul', 'Kit Primeiros Socorros Ipê',
]
CATEGORIAS = [
    (CategoriaRecurso.TECNOLOGIA, 'TEC'),
    (CategoriaRecurso.ESPORTES, 'ESP'),
    (CategoriaRecurso.MANUTENCAO, 'MAN'),
    (CategoriaRecurso.APOIO, 'APO'),
    (CategoriaRecurso.OUTROS, 'OUT'),
]


def caminho_manifesto():
    banco = str(settings.DATABASES['default']['NAME']).encode('utf-8')
    identificador = hashlib.sha256(banco).hexdigest()[:12]
    return Path(tempfile.gettempdir()) / f'reservas_paginacao_{identificador}.json'


def pdf_ficticio(titulo):
    texto = slugify(titulo).replace('-', ' ')[:90]
    texto_pdf = f'BT /F1 12 Tf 72 720 Td ({texto}) Tj ET'.encode('ascii')
    fluxo = b'<< /Length ' + str(len(texto_pdf)).encode('ascii') + b' >>\nstream\n' + texto_pdf + b'\nendstream'
    objetos = [
        b'<< /Type /Catalog /Pages 2 0 R >>',
        b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
        fluxo,
        b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ]
    partes = [b'%PDF-1.4\n']
    offsets = [0]
    for numero, objeto in enumerate(objetos, start=1):
        offsets.append(sum(map(len, partes)))
        partes.append(f'{numero} 0 obj\n'.encode('ascii') + objeto + b'\nendobj\n')
    inicio_xref = sum(map(len, partes))
    xref = [f'xref\n0 {len(objetos) + 1}\n'.encode('ascii'), b'0000000000 65535 f \n']
    xref.extend(f'{offset:010d} 00000 n \n'.encode('ascii') for offset in offsets[1:])
    partes.extend(xref)
    partes.append(
        f'trailer\n<< /Size {len(objetos) + 1} /Root 1 0 R >>\nstartxref\n{inicio_xref}\n%%EOF'.encode('ascii')
    )
    return b''.join(partes)


def salvar_manifesto(dados):
    manifesto = caminho_manifesto()
    manifesto.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding='utf-8')
    return manifesto


def ids(registros):
    return [registro.pk for registro in registros]


def popular():
    manifesto = caminho_manifesto()
    if manifesto.exists():
        return f'Já existe um lote registrado em {manifesto}. Apague-o antes de inserir outro.'

    administrador = HubUser.objects.filter(papel=Papel.ADMIN, is_active=True).order_by('email').first()
    if administrador is None:
        return 'Não encontrei um usuário administrador ativo no banco atual.'

    arquivos_criados = []
    try:
        with transaction.atomic():
            pessoas = []
            for indice, nome in enumerate(NOMES_PESSOAS, start=1):
                email = f'{slugify(nome).replace("-", ".")}.{indice:02d}@example.invalid'
                pessoa = HubUser(
                    id=uuid.uuid4(), email=email, nome=nome, papel=Papel.ALUNO,
                    is_active=True, is_staff=False,
                )
                pessoa.set_unusable_password()
                pessoa.save()
                pessoas.append(pessoa)

            blocos = [
                Bloco.objects.create(numero=f'{40 + indice:02d}', nome=nome, banheiro=True, acessibilidade=[])
                for indice, nome in enumerate(NOMES_BLOCOS, start=1)
            ]
            areas = [
                Area.objects.create(
                    nome=nome, bloco=blocos[indice - 1], capacidade=24 + indice,
                    caracteristica='Ambiente reservado para atividades acadêmicas e encontros.',
                    disponibilidade=True, status='ATIVO', equipamento=[],
                )
                for indice, nome in enumerate(NOMES_AREAS, start=1)
            ]
            veiculos = [
                Veiculo.objects.create(
                    nome=f'{nome} {indice:02d}',
                    placa=f'QAP{(indice - 1) % 10}{chr(65 + (indice - 1) // 10)}{indice:02d}',
                    marca='Vento Sul', modelo=f'Linha Horizonte {indice:02d}',
                    capacidade=7, combustivel='Flex', quilometragem=18200 + indice * 317,
                    cor='Azul', observacao='Veículo fictício para validação de listas.', status='ATIVO',
                )
                for indice, nome in enumerate(NOMES_VEICULOS, start=1)
            ]

            tipos = []
            recursos = []
            for categoria, sigla in CATEGORIAS:
                for indice, nome in enumerate(NOMES_TIPOS, start=1):
                    tipo = TipoRecurso.objects.create(
                        descricao=f'{nome} {sigla}{indice:02d}', categoria=categoria,
                    )
                    tipos.append(tipo)
                    recursos.append(RecursoGeral.objects.create(
                        nome=f'{nome} - conjunto {indice:02d} {sigla}',
                        tipo_recurso=tipo, codigo=f'AC-{sigla}-{indice:02d}',
                        tipo_prazo=TipoPrazo.CURTO_PRAZO, quantidade_total=40,
                        quantidade_reservada=0, tem_termo_de_responsabilidade=False,
                        observacao='Item fictício para teste de paginação.', status='ATIVO',
                    ))

            grupos = []
            for tipo, sufixo in ((Papel.SERVIDOR, 'servidores'), (Papel.ALUNO, 'estudantes')):
                grupos.extend(
                    Grupo.objects.create(
                        nome=f'{nome} de {sufixo}', tipo_membro_permitido=tipo,
                        data_inicio_validade=date.today(), criador=administrador,
                    )
                    for nome in NOMES_GRUPOS
                )
            grupo_membros = next(grupo for grupo in grupos if grupo.tipo_membro_permitido == Papel.ALUNO)
            membros = [MembroGrupo.objects.create(grupo=grupo_membros, usuario=pessoa) for pessoa in pessoas]

            primeiro_dia = date.today() + timedelta(days=35)
            reservas_areas = []
            reservas_recursos = []
            reservas_veiculos = []
            for indice in range(QUANTIDADE_POR_LISTA):
                data_reserva = primeiro_dia + timedelta(days=indice)
                reservas_areas.append(ReservaArea.objects.create(
                    nome=f'Encontro no {NOMES_AREAS[indice]}',
                    descricao='Atividade fictícia para testar a listagem de reservas.',
                    status=StatusReserva.PENDENTE, data=data_reserva,
                    horario_inicio=time(9, 0), horario_fim=time(10, 0),
                    tipo_reserva=TipoReserva.INTERNA, usuario=administrador,
                    area=areas[indice], aula=False,
                ))
                reservas_recursos.append(ReservaRecursoGeral.objects.create(
                    nome=f'Oficina {NOMES_GRUPOS[indice]}',
                    descricao='Reserva fictícia para validar filtros e paginação.',
                    status=StatusReserva.PENDENTE, data=data_reserva,
                    horario_inicio=time(10, 0), horario_fim=time(11, 0),
                    tipo_reserva=TipoReserva.INTERNA, usuario=administrador,
                    recurso_geral=recursos[indice], data_devolucao_prevista=data_reserva,
                    quantidades=1,
                ))
                reservas_veiculos.append(ReservaVeiculo.objects.create(
                    nome=f'Visita técnica {NOMES_VEICULOS[indice]}',
                    descricao='Deslocamento fictício para testar solicitações de termos.',
                    status=StatusReserva.AGUARDANDO_TERMO, data=data_reserva,
                    horario_inicio=time(8, 0), horario_fim=time(12, 0),
                    tipo_reserva=TipoReserva.INTERNA, usuario=administrador,
                    destino=f'Unidade {NOMES_BLOCOS[indice]}',
                    finalidade='Atividade de campo', quantidade_passageiros=4,
                    data_devolucao_prevista=data_reserva, veiculo=veiculos[indice],
                ))

            notificacoes = [
                Notificacao.objects.create(
                    usuario=administrador, reserva=reserva,
                    tipo=TipoNotificacao.CONFIRMACAO_RESERVA,
                    titulo=f'Atualização: {reserva.nome}',
                    mensagem='Aviso fictício criado para testar a lista de notificações.',
                )
                for reserva in reservas_recursos
            ]

            manifesto_termos = []
            for indice, reserva in enumerate(reservas_veiculos, start=1):
                nome_termo = f'Termo de responsabilidade da {reserva.reservaveiculo.veiculo.nome}'
                termo = TermoResponsabilidade(
                    reserva=reserva, nome_original=f'{nome_termo}.pdf',
                    tipo=TipoTermo.RESPONSABILIDADE, status=StatusTermo.PENDENTE,
                    atual=True, enviado_por=administrador,
                )
                conteudo_pdf = ContentFile(pdf_ficticio(nome_termo))
                termo.arquivo_original.save(f'reserva-{indice:02d}-original.pdf', conteudo_pdf, save=False)
                arquivos_criados.append(termo.arquivo_original.name)
                termo.arquivo_assinado.save(
                    f'reserva-{indice:02d}-assinado.pdf',
                    ContentFile(pdf_ficticio(f'Cópia assinada: {nome_termo}')),
                    save=False,
                )
                arquivos_criados.append(termo.arquivo_assinado.name)
                termo.save()
                manifesto_termos.append(termo)

            grupo_auditoria = grupos[0]
            logs = [
                LogAuditoria.objects.create(
                    admin=administrador, acao=AcaoAuditoria.CRIAR,
                    entidade=EntidadeAuditoria.GRUPO, objeto_id=grupo_auditoria.pk,
                    descricao=f'{grupo_auditoria.nome} - ação administrativa {indice:02d}',
                )
                for indice in range(1, QUANTIDADE_POR_LISTA + 1)
            ]

            dados = {
                'users': [str(pessoa.pk) for pessoa in pessoas],
                'blocks': ids(blocos),
                'areas': ids(areas),
                'vehicles': ids(veiculos),
                'resource_types': ids(tipos),
                'resources': ids(recursos),
                'groups': ids(grupos),
                'members': ids(membros),
                'area_reservations': ids(reservas_areas),
                'resource_reservations': ids(reservas_recursos),
                'vehicle_reservations': ids(reservas_veiculos),
                'notifications': ids(notificacoes),
                'terms': ids(manifesto_termos),
                'audit_logs': ids(logs),
                'files': arquivos_criados,
            }
        salvo_em = salvar_manifesto(dados)
    except Exception:
        for nome_arquivo in arquivos_criados:
            default_storage.delete(nome_arquivo)
        raise

    return '\n'.join((
        'Dados inseridos para testar áreas, blocos, recursos, veículos, grupos, membros,',
        'reservas, solicitações de termos, notificações e auditoria.',
        f'Foram criados {len(grupos)} grupos, {len(membros)} membros e {len(tipos)} tipos de recurso.',
        f'IDs do lote registrados em: {salvo_em}',
    ))


def apagar():
    manifesto = caminho_manifesto()
    if not manifesto.exists():
        return 'Não há lote deste comando registrado para apagar neste banco.'

    dados = json.loads(manifesto.read_text(encoding='utf-8'))
    with transaction.atomic():
        TermoResponsabilidade.objects.filter(pk__in=dados.get('terms', [])).delete()
        Notificacao.objects.filter(pk__in=dados.get('notifications', []))._raw_delete('default')
        LogAuditoria.objects.filter(pk__in=dados.get('audit_logs', []))._raw_delete('default')

        ReservaArea.objects.filter(pk__in=dados.get('area_reservations', [])).delete()
        ReservaRecursoGeral.objects.filter(pk__in=dados.get('resource_reservations', [])).delete()
        ReservaVeiculo.objects.filter(pk__in=dados.get('vehicle_reservations', [])).delete()

        MembroGrupo._base_manager.filter(pk__in=dados.get('members', []))._raw_delete('default')
        AutorizacaoGrupo.objects.filter(grupo_id__in=dados.get('groups', []))._raw_delete('default')
        Grupo.todos.filter(pk__in=dados.get('groups', []))._raw_delete('default')

        RecursoGeral.objects.filter(pk__in=dados.get('resources', [])).delete()
        Veiculo.objects.filter(pk__in=dados.get('vehicles', [])).delete()
        Area.objects.filter(pk__in=dados.get('areas', [])).delete()
        Bloco.objects.filter(pk__in=dados.get('blocks', [])).delete()
        TipoRecurso.objects.filter(pk__in=dados.get('resource_types', [])).delete()
        HubUser.objects.filter(pk__in=dados.get('users', []))._raw_delete('default')

    for nome_arquivo in dados.get('files', []):
        default_storage.delete(nome_arquivo)
    manifesto.unlink()
    return 'Lote fictício removido do banco e arquivos de termos apagados.'


class Command(BaseCommand):
    help = 'Insere ou apaga dados fictícios para testar telas com paginação.'

    def add_arguments(self, parser):
        modo = parser.add_mutually_exclusive_group()
        modo.add_argument('--popular', action='store_true', help='Insere o lote de dados fictícios.')
        modo.add_argument('--apagar', action='store_true', help='Apaga somente o lote criado por este comando.')

    def handle(self, *args, **options):
        acao = 'popular' if options['popular'] else 'apagar' if options['apagar'] else None
        if acao is None:
            self.stdout.write('Teste de paginação do Sistema de Reservas')
            self.stdout.write('1. Inserir dados fictícios no banco atual')
            self.stdout.write('2. Apagar o lote inserido por este comando')
            self.stdout.write('0. Sair')
            opcao = input('Escolha uma opção: ').strip()
            acao = {'1': 'popular', '2': 'apagar'}.get(opcao)
            if opcao == '0':
                return
            if acao is None:
                raise CommandError('Opção inválida.')
            confirmar = input('Confirma a operação? (s/N): ').strip().lower()
            if confirmar != 's':
                self.stdout.write('Operação cancelada.')
                return

        mensagem = popular() if acao == 'popular' else apagar()
        self.stdout.write(mensagem)
