from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models.area_model import Area
from api.permissions.escrita_admin import EscritaAdmin
from api.serializers.area_serializer import AreaSerializer
from api.enumerations.auditoria_enumerations import AcaoAuditoria
from api.services.auditoria import foto, registrar_auditoria


class AreaListCreateView(APIView):
    permission_classes = [EscritaAdmin]

    def get(self, request):
        areas = Area.objects.all().select_related('bloco')
        serializer = AreaSerializer(areas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = AreaSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                area = serializer.save()
                registrar_auditoria(request.user, AcaoAuditoria.CRIAR, area, depois=foto(area))
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AreaDetailView(APIView):
    permission_classes = [EscritaAdmin]

    def get(self, request, pk):
        area = get_object_or_404(Area.objects.select_related('bloco'), pk=pk)
        serializer = AreaSerializer(area)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        area = get_object_or_404(Area, pk=pk)
        antes = foto(area)
        serializer = AreaSerializer(area, data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                serializer.save()
                registrar_auditoria(request.user, AcaoAuditoria.EDITAR, area, antes=antes, depois=foto(area))
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        area = get_object_or_404(Area, pk=pk)
        antes = foto(area)
        serializer = AreaSerializer(area, data=request.data, partial=True)
        if serializer.is_valid():
            with transaction.atomic():
                serializer.save()
                registrar_auditoria(request.user, AcaoAuditoria.EDITAR, area, antes=antes, depois=foto(area))
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        area = get_object_or_404(Area, pk=pk)
        with transaction.atomic():
            registrar_auditoria(request.user, AcaoAuditoria.EXCLUIR, area, antes=foto(area))
            area.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)