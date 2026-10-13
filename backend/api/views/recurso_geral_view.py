from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404
from api.models.recurso_geral_model import RecursoGeral
from api.serializers.recurso_geral_serializer import RecursoGeralSerializer
from api.permissions.escrita_admin import EscritaAdmin
from api.enumerations.auditoria_enumerations import AcaoAuditoria
from api.services.auditoria import foto, registrar_auditoria


class RecursoGeralListCreateView(APIView):
    permission_classes = [EscritaAdmin]

    def get(self, request):
        recursos = RecursoGeral.objects.all()
        serializer = RecursoGeralSerializer(recursos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = RecursoGeralSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                recurso = serializer.save()
                registrar_auditoria(request.user, AcaoAuditoria.CRIAR, recurso, depois=foto(recurso))
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RecursoGeralDetailView(APIView):
    permission_classes = [EscritaAdmin]

    def get(self, request, pk):
        recurso = get_object_or_404(RecursoGeral, pk=pk)
        serializer = RecursoGeralSerializer(recurso)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        recurso = get_object_or_404(RecursoGeral, pk=pk)
        antes = foto(recurso)
        serializer = RecursoGeralSerializer(recurso, data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                serializer.save()
                registrar_auditoria(request.user, AcaoAuditoria.EDITAR, recurso, antes=antes, depois=foto(recurso))
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        recurso = get_object_or_404(RecursoGeral, pk=pk)
        antes = foto(recurso)
        serializer = RecursoGeralSerializer(recurso, data=request.data, partial=True)
        if serializer.is_valid():
            with transaction.atomic():
                serializer.save()
                registrar_auditoria(request.user, AcaoAuditoria.EDITAR, recurso, antes=antes, depois=foto(recurso))
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        recurso = get_object_or_404(RecursoGeral, pk=pk)
        with transaction.atomic():
            registrar_auditoria(request.user, AcaoAuditoria.EXCLUIR, recurso, antes=foto(recurso))
            recurso.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
