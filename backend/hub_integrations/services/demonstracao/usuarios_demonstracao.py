import uuid

from accounts.models import HubUser
from hub_integrations.services.mapeamento_papel import mapear_papel

PERFIL_DEMONSTRACAO_PADRAO = 'admin'

USUARIOS_DEMONSTRACAO = {
    'admin': {
        'id': uuid.UUID('00000000-0000-4000-8000-000000000001'),
        'username': 'Helena Duarte',
        'email': 'helena.duarte@ifrs.edu.br',
        'access_profile': 'servidor',
        'groups': ['admin'],
    },
    'servidor': {
        'id': uuid.UUID('00000000-0000-4000-8000-000000000002'),
        'username': 'Paulo Rezende',
        'email': 'paulo.rezende@ifrs.edu.br',
        'access_profile': 'servidor',
        'groups': [],
    },
    'aluno': {
        'id': uuid.UUID('00000000-0000-4000-8000-000000000003'),
        'username': 'Clara Nogueira',
        'email': 'clara.nogueira@aluno.ifrs.edu.br',
        'access_profile': 'aluno',
        'groups': [],
    },
    'convidado': {
        'id': uuid.UUID('00000000-0000-4000-8000-000000000004'),
        'username': 'Marcos Visitante',
        'email': 'marcos.visitante@example.com',
        'access_profile': 'convidado',
        'groups': [],
    },
}

IDS_USUARIOS_DEMONSTRACAO = {str(dados['id']) for dados in USUARIOS_DEMONSTRACAO.values()}


def eh_usuario_demonstracao(user_id):
    return str(user_id) in IDS_USUARIOS_DEMONSTRACAO


def garantir_usuario_demonstracao(perfil):
    dados = USUARIOS_DEMONSTRACAO[perfil]
    dados_hub = {
        'email': dados['email'],
        'username': dados['username'],
        'access_profile': dados['access_profile'],
        'is_active': True,
    }
    papel = mapear_papel(dados['access_profile'], dados['groups'])
    return HubUser.objects.sincronizar(dados['id'], dados_hub, papel)
