from .view_helpers import listar
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models.deletion import ProtectedError
from rest_framework.exceptions import ValidationError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models.veiculo_model import Veiculo
from api.serializers.veiculo_serializer import VeiculoSerializer
from api.permissions.escrita_admin import EscritaAdmin
from api.services.veiculo_service import validar_alteracao_veiculo, validar_exclusao_veiculo
from api.enumerations.auditoria_enumerations import AcaoAuditoria
from api.services.auditoria import foto, registrar_auditoria


class VeiculoCreateView(APIView):
    permission_classes = [EscritaAdmin]

    def get(self, request):
        veiculos = Veiculo.objects.all().order_by("id")
        return listar(request, veiculos, VeiculoSerializer)

    def post(self, request):
        serializer = VeiculoSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                veiculo = serializer.save()
                registrar_auditoria(request.user, AcaoAuditoria.CRIAR, veiculo, depois=foto(veiculo))
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VeiculoDetailView(APIView):
    permission_classes = [EscritaAdmin]

    def get(self, request, pk):
        veiculo = get_object_or_404(Veiculo, pk=pk)
        serializer = VeiculoSerializer(veiculo)
        return Response(serializer.data)

    def put(self, request, pk):
        veiculo = get_object_or_404(Veiculo, pk=pk)
        antes = foto(veiculo)
        serializer = VeiculoSerializer(veiculo, data=request.data)
        if serializer.is_valid():
            validar_alteracao_veiculo(veiculo, serializer.validated_data)
            with transaction.atomic():
                serializer.save()
                registrar_auditoria(request.user, AcaoAuditoria.EDITAR, veiculo, antes=antes, depois=foto(veiculo))
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        veiculo = get_object_or_404(Veiculo, pk=pk)
        antes = foto(veiculo)
        serializer = VeiculoSerializer(veiculo, data=request.data, partial=True)
        if serializer.is_valid():
            validar_alteracao_veiculo(veiculo, serializer.validated_data)
            with transaction.atomic():
                serializer.save()
                registrar_auditoria(request.user, AcaoAuditoria.EDITAR, veiculo, antes=antes, depois=foto(veiculo))
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        veiculo = get_object_or_404(Veiculo, pk=pk)
        validar_exclusao_veiculo(veiculo)
        try:
            with transaction.atomic():
                registrar_auditoria(request.user, AcaoAuditoria.EXCLUIR, veiculo, antes=foto(veiculo))
                veiculo.delete()
        except ProtectedError:
            raise ValidationError({'detail': 'Não é possível excluir um veículo com reservas vinculadas.'})
        return Response(status=status.HTTP_204_NO_CONTENT)
