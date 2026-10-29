from django.shortcuts import get_object_or_404
from rest_framework.views import APIView

from api.models.log_auditoria_model import LogAuditoria
from api.permissions.somente_admin import SomenteAdmin
from api.serializers.log_auditoria_serializer import LogAuditoriaDetalheSerializer, LogAuditoriaSerializer
from api.services.auditoria import filtrar_logs_auditoria
from .view_helpers import detalhar, listar


class LogAuditoriaListView(APIView):
    permission_classes = [SomenteAdmin]

    def get(self, request):
        return listar(request, filtrar_logs_auditoria(request.query_params), LogAuditoriaSerializer)


class LogAuditoriaDetailView(APIView):
    permission_classes = [SomenteAdmin]

    def get(self, request, pk):
        log = get_object_or_404(LogAuditoria.objects.select_related('responsavel', 'usuario_afetado'), pk=pk)
        return detalhar(log, LogAuditoriaDetalheSerializer)
