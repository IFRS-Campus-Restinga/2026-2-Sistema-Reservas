from django.db import transaction
from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.enumerations.auditoria_enumerations import AcaoAuditoria
from api.models.equipamento_area_model import EquipamentoArea
from api.permissions.escrita_admin import EscritaAdmin
from api.permissions.regras_comuns import LeituraPublica
from api.serializers.equipamento_area_serializer import EquipamentoAreaSerializer
from api.services.auditoria import foto, registrar_auditoria
from hub_integrations.authentication import HubJWTAuthenticationOpcional
from .view_helpers import listar


class EquipamentoAreaListCreateView(APIView):
    authentication_classes = [HubJWTAuthenticationOpcional]
    permission_classes = [LeituraPublica | EscritaAdmin]

    def get(self, request):
        equipamentos = EquipamentoArea.objects.annotate(total_areas=Count('areas'))
        return listar(request, equipamentos, EquipamentoAreaSerializer)

    def post(self, request):
        serializer = EquipamentoAreaSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                equipamento = serializer.save()
                registrar_auditoria(request.user, AcaoAuditoria.CRIAR, equipamento, depois=foto(equipamento))
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EquipamentoAreaDetailView(APIView):
    permission_classes = [EscritaAdmin]

    def get(self, request, pk):
        equipamento = get_object_or_404(EquipamentoArea, pk=pk)
        return Response(EquipamentoAreaSerializer(equipamento).data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        return self._salvar(request, pk, parcial=False)

    def patch(self, request, pk):
        return self._salvar(request, pk, parcial=True)

    def _salvar(self, request, pk, parcial):
        equipamento = get_object_or_404(EquipamentoArea, pk=pk)
        antes = foto(equipamento)
        serializer = EquipamentoAreaSerializer(equipamento, data=request.data, partial=parcial)
        if serializer.is_valid():
            with transaction.atomic():
                serializer.save()
                registrar_auditoria(request.user, AcaoAuditoria.EDITAR, equipamento, antes=antes, depois=foto(equipamento))
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        equipamento = get_object_or_404(EquipamentoArea, pk=pk)
        # ManyToMany não tem PROTECT: sem esta checagem o equipamento sumiria das áreas sem aviso.
        if equipamento.areas.exists():
            return Response(
                {'detail': 'Este equipamento está cadastrado em uma ou mais áreas. Remova-o das áreas antes de excluir.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            registrar_auditoria(request.user, AcaoAuditoria.EXCLUIR, equipamento, antes=foto(equipamento))
            equipamento.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
