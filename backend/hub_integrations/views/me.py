from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.permissions.permissoes_usuario import permissoes_do_usuario, resumo_autorizacoes


@api_view(['GET'])
def quem_sou_eu(request):
    usuario = request.user
    return Response({
        'id': str(usuario.id),
        'email': usuario.email,
        'nome': usuario.nome,
        'perfil_acesso': usuario.perfil_acesso,
        'papel': usuario.papel,
        'permissoes': permissoes_do_usuario(usuario),
        'autorizacoes': resumo_autorizacoes(usuario),
    })
