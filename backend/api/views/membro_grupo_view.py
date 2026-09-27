from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models.hub_user import HubUser
from api.models.grupo_model import Grupo
from api.models.membro_grupo_model import MembroGrupo
from api.permissions.grupo_permissions import PodeGerenciarMembrosGrupo
from api.serializers.membro_grupo_serializer import MembroGrupoSerializer, CandidatoMembroSerializer
from .view_helpers import BuscarObjetoComPermissaoMixin, listar, detalhar, atualizar, remover

class MembroGrupoListCreateView(APIView):
    permission_classes = [PodeGerenciarMembrosGrupo]

    def get_grupo(self, grupo_pk):
        return get_object_or_404(Grupo, pk=grupo_pk)

    def get(self, request, grupo_pk):
        self.get_grupo(grupo_pk)
        membros = MembroGrupo.objects.filter(grupo_id=grupo_pk).select_related('usuario', 'grupo').order_by('id')
        return listar(request, membros, MembroGrupoSerializer)

    def post(self, request, grupo_pk):
        grupo = self.get_grupo(grupo_pk)
        serializer = MembroGrupoSerializer(data=request.data, many=True, context={'grupo': grupo})
        serializer.is_valid(raise_exception=True)
        usuarios = [item['usuario'] for item in serializer.validated_data]
        if len(usuarios) != len(set(usuarios)):
            return Response({'detail': 'Há usuários repetidos na seleção.'}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            serializer.save(grupo=grupo)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MembroGrupoCandidatosView(APIView):
    permission_classes = [PodeGerenciarMembrosGrupo]

    def get(self, request, grupo_pk):
        grupo = get_object_or_404(Grupo, pk=grupo_pk)
        busca = request.query_params.get('busca', '').strip()
        candidatos = HubUser.objects.none()
        if busca:
            candidatos = (
                HubUser.objects
                .filter(Q(nome__icontains=busca) | Q(email__icontains=busca), is_active=True, papel=grupo.tipo_membro_permitido)
                .exclude(autorizacoes_grupo__grupo=grupo)
                .order_by('nome')
            )
        return listar(request, candidatos, CandidatoMembroSerializer)


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
