import uuid

from django.db import transaction
from django.db.models import Case, IntegerField, Q, Value, When
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

    LIMITE_PADRAO = 10
    LIMITE_MAXIMO = 50

    def get(self, request, grupo_pk):
        grupo = get_object_or_404(Grupo, pk=grupo_pk)
        busca = request.query_params.get('busca', '').strip()
        if not busca:
            return Response({'resultados': [], 'tem_mais': False})

        limite = self.ler_limite(request.query_params.get('limite'))
        candidatos = (
            HubUser.objects
            .filter(Q(nome__icontains=busca) | Q(email__icontains=busca), is_active=True, papel=grupo.tipo_membro_permitido)
            .exclude(id__in=MembroGrupo.objects.filter(grupo=grupo).values('usuario_id'))
            .exclude(id__in=self.ler_ids_excluidos(request.query_params.get('excluir', '')))
            .annotate(relevancia=Case(
                When(nome__istartswith=busca, then=Value(0)),
                When(email__istartswith=busca, then=Value(1)),
                default=Value(2),
                output_field=IntegerField(),
            ))
            .order_by('relevancia', 'nome')
        )
        # Busca um a mais que o limite só para saber se há outros resultados além dos exibidos.
        encontrados = list(candidatos[:limite + 1])
        return Response({
            'resultados': CandidatoMembroSerializer(encontrados[:limite], many=True).data,
            'tem_mais': len(encontrados) > limite,
        })

    def ler_limite(self, valor):
        try:
            return min(max(int(valor), 1), self.LIMITE_MAXIMO)
        except (TypeError, ValueError):
            return self.LIMITE_PADRAO

    def ler_ids_excluidos(self, valor):
        ids = []
        for item in valor.split(','):
            try:
                ids.append(uuid.UUID(item.strip()))
            except ValueError:
                continue
        return ids


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
