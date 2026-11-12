from django.db import transaction
from django.db.models import Count, ProtectedError
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.enumerations.auditoria_enumerations import AcaoAuditoria
from api.models.categoria_recurso_model import CategoriaRecurso
from api.permissions.escrita_admin import EscritaAdmin
from api.permissions.regras_comuns import LeituraPublica
from api.serializers.categoria_recurso_serializer import CategoriaRecursoSerializer
from api.services.auditoria import foto, registrar_auditoria
from hub_integrations.authentication import HubJWTAuthenticationOpcional
from .view_helpers import listar


class CategoriaRecursoListCreateView(APIView):
    # Leitura pública: o filtro do catálogo de recursos também usa esta lista.
    authentication_classes = [HubJWTAuthenticationOpcional]
    permission_classes = [LeituraPublica | EscritaAdmin]

    def get(self, request):
        categorias = CategoriaRecurso.objects.annotate(total_tipos=Count('tipos'))
        return listar(request, categorias, CategoriaRecursoSerializer)

    def post(self, request):
        serializer = CategoriaRecursoSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                categoria = serializer.save()
                registrar_auditoria(request.user, AcaoAuditoria.CRIAR, categoria, depois=foto(categoria))
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategoriaRecursoDetailView(APIView):
    permission_classes = [EscritaAdmin]

    def get(self, request, pk):
        categoria = get_object_or_404(CategoriaRecurso, pk=pk)
        return Response(CategoriaRecursoSerializer(categoria).data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        return self._salvar(request, pk, parcial=False)

    def patch(self, request, pk):
        return self._salvar(request, pk, parcial=True)

    def _salvar(self, request, pk, parcial):
        categoria = get_object_or_404(CategoriaRecurso, pk=pk)
        antes = foto(categoria)
        serializer = CategoriaRecursoSerializer(categoria, data=request.data, partial=parcial)
        if serializer.is_valid():
            with transaction.atomic():
                serializer.save()
                registrar_auditoria(request.user, AcaoAuditoria.EDITAR, categoria, antes=antes, depois=foto(categoria))
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        categoria = get_object_or_404(CategoriaRecurso, pk=pk)
        try:
            with transaction.atomic():
                registrar_auditoria(request.user, AcaoAuditoria.EXCLUIR, categoria, antes=foto(categoria))
                categoria.delete()
        except ProtectedError:
            return Response(
                {'detail': 'Esta categoria está vinculada a tipos de recurso e não pode ser excluída.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)
