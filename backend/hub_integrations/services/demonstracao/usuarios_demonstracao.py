import uuid

from accounts.enumerations import Papel
from accounts.models import HubUser
from accounts.services.administrador_service import autorizar_administrador
from hub_integrations.services.mapeamento_papel import mapear_papel

PERFIL_DEMONSTRACAO_PADRAO = 'admin'

USUARIOS_DEMONSTRACAO = {
    'admin': {
        'id': uuid.UUID('00000000-0000-4000-8000-000000000001'),
        'username': 'Helena Duarte',
        'email': 'helena.duarte@ifrs.edu.br',
        'access_profile': 'servidor',
        'admin': True,
        'descricao': 'Administradora principal',
    },
    'admin-2': {
        'id': uuid.UUID('00000000-0000-4000-8000-000000000005'),
        'username': 'Otávio Ramos',
        'email': 'otavio.ramos@ifrs.edu.br',
        'access_profile': 'servidor',
        'admin': True,
        'descricao': 'Segundo administrador',
    },
    'servidor': {
        'id': uuid.UUID('00000000-0000-4000-8000-000000000002'),
        'username': 'Paulo Rezende',
        'email': 'paulo.rezende@ifrs.edu.br',
        'access_profile': 'servidor',
        'descricao': 'Com grupo de veículos',
    },
    'servidor-sem-grupo': {
        'id': uuid.UUID('00000000-0000-4000-8000-000000000006'),
        'username': 'Sônia Prado',
        'email': 'sonia.prado@ifrs.edu.br',
        'access_profile': 'servidor',
        'descricao': 'Sem grupo',
    },
    'aluno': {
        'id': uuid.UUID('00000000-0000-4000-8000-000000000003'),
        'username': 'Clara Nogueira',
        'email': 'clara.nogueira@aluno.ifrs.edu.br',
        'access_profile': 'aluno',
        'descricao': 'Com grupos vigentes',
    },
    'aluno-sem-grupo': {
        'id': uuid.UUID('00000000-0000-4000-8000-000000000007'),
        'username': 'Diego Azevedo',
        'email': 'diego.azevedo@aluno.ifrs.edu.br',
        'access_profile': 'aluno',
        'descricao': 'Sem grupo',
    },
    'aluno-grupo-vencido': {
        'id': uuid.UUID('00000000-0000-4000-8000-000000000008'),
        'username': 'Bianca Teixeira',
        'email': 'bianca.teixeira@aluno.ifrs.edu.br',
        'access_profile': 'aluno',
        'descricao': 'Com grupo vencido',
    },
    'convidado': {
        'id': uuid.UUID('00000000-0000-4000-8000-000000000004'),
        'username': 'Marcos Visitante',
        'email': 'marcos.visitante@example.com',
        'access_profile': 'convidado',
        'descricao': 'Apenas visualiza o calendário',
    },
}

IDS_USUARIOS_DEMONSTRACAO = {str(dados['id']) for dados in USUARIOS_DEMONSTRACAO.values()}


def eh_usuario_demonstracao(user_id):
    return str(user_id) in IDS_USUARIOS_DEMONSTRACAO


def listar_usuarios_demonstracao():
    return [
        {
            'chave': chave,
            'id': str(dados['id']),
            'nome': dados['username'],
            'papel': Papel.ADMIN if dados.get('admin') else mapear_papel(dados['access_profile'], dados['email']),
            'descricao': dados['descricao'],
        }
        for chave, dados in USUARIOS_DEMONSTRACAO.items()
    ]


def garantir_usuario_demonstracao(perfil):
    dados = USUARIOS_DEMONSTRACAO[perfil]
    dados_hub = {
        'email': dados['email'],
        'username': dados['username'],
        'access_profile': dados['access_profile'],
        'is_active': True,
    }
    if dados.get('admin'):
        autorizar_administrador(dados['email'])
    papel = mapear_papel(dados['access_profile'], dados['email'])
    return HubUser.objects.sincronizar(dados['id'], dados_hub, papel)
