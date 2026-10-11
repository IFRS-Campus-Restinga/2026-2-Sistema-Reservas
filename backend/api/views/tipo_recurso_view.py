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
        serializer = TipoRecursoSerializer(tipos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = TipoRecursoSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                tipo = serializer.save()
                registrar_auditoria(request.user, AcaoAuditoria.CRIAR, tipo, depois=foto(tipo))
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
