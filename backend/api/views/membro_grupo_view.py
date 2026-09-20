from django.shortcuts import get_object_or_404
from rest_framework.views import APIView

from api.models.grupo_model import Grupo
from api.models.membro_grupo_model import MembroGrupo
from api.permissions.grupo_permissions import PodeGerenciarMembrosGrupo
from api.serializers.membro_grupo_serializer import MembroGrupoSerializer
from .grupo_view_helpers import BuscarObjetoComPermissaoMixin, listar, detalhar, criar, atualizar, remover

class MembroGrupoListCreateView(APIView):
    permission_classes = [PodeGerenciarMembrosGrupo]

    def get_grupo(self, grupo_pk):
        return get_object_or_404(Grupo, pk=grupo_pk)

    def get(self, request, grupo_pk):
        self.get_grupo(grupo_pk)
        membros = MembroGrupo.objects.filter(grupo_id=grupo_pk).select_related('usuario', 'grupo')
        return listar(membros, MembroGrupoSerializer)

    def post(self, request, grupo_pk):
        grupo = self.get_grupo(grupo_pk)
        return criar(request, MembroGrupoSerializer, context={'grupo': grupo}, grupo=grupo)


class MembroGrupoDetailView(BuscarObjetoComPermissaoMixin, APIView):
    permission_classes = [PodeGerenciarMembrosGrupo]

    def get_queryset(self):
        return MembroGrupo.objects.filter(grupo_id=self.kwargs['grupo_pk']).select_related('usuario', 'grupo')

    def get(self, request, grupo_pk, pk):
        return detalhar(self.get_object(pk), MembroGrupoSerializer)

    def patch(self, request, grupo_pk, pk):
        return atualizar(request, self.get_object(pk), MembroGrupoSerializer, partial=True)

    def delete(self, request, grupo_pk, pk):
        return remover(self.get_object(pk))
