from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404

from api.models.bloco_model import Bloco
from api.serializers.bloco_serializer import BlocoSerializer
from api.enumerations.auditoria_enumerations import AcaoAuditoria
from api.services.auditoria import foto, registrar_auditoria
from api.permissions.escrita_admin import EscritaAdmin
from api.permissions.regras_comuns import LeituraPublica
from hub_integrations.authentication import HubJWTAuthenticationOpcional


class BlocoListCreateView(APIView):
    authentication_classes = [HubJWTAuthenticationOpcional]
    permission_classes = [LeituraPublica | EscritaAdmin]

    def get(self, request):
        blocos = Bloco.objects.all()
        serializer = BlocoSerializer(blocos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = BlocoSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                bloco = serializer.save()
                registrar_auditoria(request.user, AcaoAuditoria.CRIAR, bloco, depois=foto(bloco))
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BlocoDetailView(APIView):
    permission_classes = [EscritaAdmin]

    def get(self, request, pk):
        bloco = get_object_or_404(Bloco, pk=pk)
        serializer = BlocoSerializer(bloco)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        bloco = get_object_or_404(Bloco, pk=pk)
        antes = foto(bloco)
        serializer = BlocoSerializer(bloco, data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                serializer.save()
                registrar_auditoria(request.user, AcaoAuditoria.EDITAR, bloco, antes=antes, depois=foto(bloco))
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        bloco = get_object_or_404(Bloco, pk=pk)
        antes = foto(bloco)
        serializer = BlocoSerializer(bloco, data=request.data, partial=True)
        if serializer.is_valid():
            with transaction.atomic():
                serializer.save()
                registrar_auditoria(request.user, AcaoAuditoria.EDITAR, bloco, antes=antes, depois=foto(bloco))
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        bloco = get_object_or_404(Bloco, pk=pk)
        with transaction.atomic():
            registrar_auditoria(request.user, AcaoAuditoria.EXCLUIR, bloco, antes=foto(bloco))
            bloco.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)