from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def quem_sou_eu(request):
    usuario = request.user
    return Response({
        'id': str(usuario.id),
        'email': usuario.email,
        'nome': usuario.nome,
        'perfil_acesso': usuario.perfil_acesso,
        'papel': usuario.papel,
    })
