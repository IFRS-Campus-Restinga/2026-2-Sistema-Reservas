from rest_framework.views import APIView

from api.models.grupo_servidor_model import GrupoServidor
from api.models.grupo_aluno_model import GrupoAluno
from api.permissions.grupo_permissions import PodeCriarGrupo, PodeGerenciarGrupo
from api.serializers.grupo_serializer import GrupoServidorSerializer, GrupoAlunoSerializer
from .grupo_view_helpers import BuscarObjetoComPermissaoMixin, listar, detalhar, criar, atualizar, remover

class GrupoServidorListCreateView(APIView):
    permission_classes = [PodeCriarGrupo]
    papeis_permitidos = ('admin',)

    def get(self, request):
        return listar(GrupoServidor.objects.select_related('criador'), GrupoServidorSerializer)

    def post(self, request):
        return criar(request, GrupoServidorSerializer, criador=request.user)


class GrupoServidorDetailView(BuscarObjetoComPermissaoMixin, APIView):
    permission_classes = [PodeGerenciarGrupo]
    queryset = GrupoServidor.objects.select_related('criador')

    def get(self, request, pk):
        return detalhar(self.get_object(pk), GrupoServidorSerializer)

    def put(self, request, pk):
        return atualizar(request, self.get_object(pk), GrupoServidorSerializer)

    def patch(self, request, pk):
        return atualizar(request, self.get_object(pk), GrupoServidorSerializer, partial=True)

    def delete(self, request, pk):
        return remover(self.get_object(pk))


class GrupoAlunoListCreateView(APIView):
    permission_classes = [PodeCriarGrupo]
    papeis_permitidos = ('admin', 'servidor')

    def get(self, request):
        return listar(GrupoAluno.objects.select_related('criador'), GrupoAlunoSerializer)

    def post(self, request):
        return criar(request, GrupoAlunoSerializer, criador=request.user)


class GrupoAlunoDetailView(BuscarObjetoComPermissaoMixin, APIView):
    permission_classes = [PodeGerenciarGrupo]
    queryset = GrupoAluno.objects.select_related('criador')

    def get(self, request, pk):
        return detalhar(self.get_object(pk), GrupoAlunoSerializer)

    def put(self, request, pk):
        return atualizar(request, self.get_object(pk), GrupoAlunoSerializer)

    def patch(self, request, pk):
        return atualizar(request, self.get_object(pk), GrupoAlunoSerializer, partial=True)

    def delete(self, request, pk):
        return remover(self.get_object(pk))
