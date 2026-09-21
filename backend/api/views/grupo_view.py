from rest_framework.views import APIView

from api.models.grupo_model import Grupo
from api.permissions.grupo_permissions import PodeCriarGrupo, PodeGerenciarGrupo
from api.permissions.regras_comuns import usuario_e_admin
from api.serializers.grupo_serializer import GrupoSerializer
from .view_helpers import BuscarObjetoComPermissaoMixin, listar, detalhar, criar, atualizar, remover

class GrupoListCreateView(APIView):
    permission_classes = [PodeCriarGrupo]

    def get(self, request):
        queryset = Grupo.objects.select_related('criador').order_by('id')
        if not usuario_e_admin(request.user):
            queryset = queryset.filter(criador=request.user)
        return listar(request, queryset, GrupoSerializer)

    def post(self, request):
        return criar(request, GrupoSerializer, criador=request.user)


class GrupoDetailView(BuscarObjetoComPermissaoMixin, APIView):
    permission_classes = [PodeGerenciarGrupo]
    queryset = Grupo.objects.select_related('criador')

    def get(self, request, pk):
        return detalhar(self.get_object(pk), GrupoSerializer)

    def put(self, request, pk):
        return atualizar(request, self.get_object(pk), GrupoSerializer)

    def patch(self, request, pk):
        return atualizar(request, self.get_object(pk), GrupoSerializer, partial=True)

    def delete(self, request, pk):
        return remover(self.get_object(pk))
