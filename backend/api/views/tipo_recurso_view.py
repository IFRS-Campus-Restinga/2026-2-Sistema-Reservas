from .view_helpers import listar
from django.db.models import Count, Sum, Q
from api.services.catalogo_recursos import categorias_catalogo
from django.db import transaction
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from api.models.tipo_recurso_model import TipoRecurso
from api.serializers.tipo_recurso_serializer import TipoRecursoSerializer
from api.permissions.escrita_admin import EscritaAdmin
from api.enumerations.auditoria_enumerations import AcaoAuditoria
from api.services.auditoria import foto, registrar_auditoria

class TipoRecursoCreateView(APIView):
    permission_classes = [EscritaAdmin]

    def get(self, request):
        tipos = TipoRecurso.objects.all()
        if request.query_params.get('catalogo') == 'true':
            from api.serializers.tipo_recurso_serializer import TipoRecursoCatalogoSerializer
            tipos = categorias_catalogo(tipos).filter(recursos__status='ATIVO', recursos__quantidade_total__gt=0).annotate(
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
