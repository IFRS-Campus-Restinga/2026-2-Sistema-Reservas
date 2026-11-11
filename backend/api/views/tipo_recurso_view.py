from .view_helpers import listar
from django.db.models import Count, Sum, Q
from django.db import transaction
from django.db.models import ProtectedError
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from api.models.tipo_recurso_model import TipoRecurso
from api.serializers.tipo_recurso_serializer import TipoRecursoSerializer
from api.permissions.escrita_admin import EscritaAdmin
from api.permissions.regras_reserva import ids_tipos_recurso_reservaveis
from api.enumerations.auditoria_enumerations import AcaoAuditoria
from api.services.auditoria import foto, registrar_auditoria

class TipoRecursoCreateView(APIView):
    permission_classes = [EscritaAdmin]

    def get(self, request):
        tipos = TipoRecurso.objects.select_related('categoria')
        if request.query_params.get('catalogo') == 'true':
            from api.serializers.tipo_recurso_serializer import TipoRecursoCatalogoSerializer
            permitidos = ids_tipos_recurso_reservaveis(request.user, tipos.values_list('pk', flat=True))
            tipos = tipos.filter(pk__in=permitidos).filter(recursos__status='ATIVO', recursos__quantidade_total__gt=0).annotate(
                total_itens=Count('recursos'), total_unidades=Sum('recursos__quantidade_total'),
                total_termos=Count('recursos', filter=Q(recursos__tem_termo_de_responsabilidade=True)),
            ).order_by('descricao')
            return listar(request, tipos, TipoRecursoCatalogoSerializer)
        return listar(request, tipos, TipoRecursoSerializer)

    def post(self, request):
        serializer = TipoRecursoSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                tipo = serializer.save()
                registrar_auditoria(request.user, AcaoAuditoria.CRIAR, tipo, depois=foto(tipo))
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TipoRecursoDetailView(APIView):
    permission_classes = [EscritaAdmin]

    def get(self, request, pk):
        tipo = get_object_or_404(TipoRecurso, pk=pk)
        return Response(TipoRecursoSerializer(tipo).data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        return self._salvar(request, pk, parcial=False)

    def patch(self, request, pk):
        return self._salvar(request, pk, parcial=True)

    def _salvar(self, request, pk, parcial):
        tipo = get_object_or_404(TipoRecurso, pk=pk)
        antes = foto(tipo)
        serializer = TipoRecursoSerializer(tipo, data=request.data, partial=parcial)
        if serializer.is_valid():
            with transaction.atomic():
                serializer.save()
                registrar_auditoria(request.user, AcaoAuditoria.EDITAR, tipo, antes=antes, depois=foto(tipo))
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        tipo = get_object_or_404(TipoRecurso, pk=pk)
        try:
            with transaction.atomic():
                registrar_auditoria(request.user, AcaoAuditoria.EXCLUIR, tipo, antes=foto(tipo))
                tipo.delete()
        except ProtectedError:
            # RecursoGeral e AutorizacaoGrupo usam on_delete=PROTECT
            return Response(
                {'detail': 'Este tipo está vinculado a recursos ou grupos e não pode ser excluído.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)
