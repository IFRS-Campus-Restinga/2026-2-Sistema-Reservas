from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models.area_model import Area
from api.permissions.is_admin_or_read_only import IsAdminUserOrReadOnly
from api.serializers.area_serializer import AreaSerializer

"""
View para gerenciamento do CRUD de Area.
"""

class AreaListCreateView(APIView):
    """
    View para listagem e criação de Áreas.

    Permissões:
    - GET: Acesso público (leitura).
    - POST: Restrito a usuários administradores (is_staff=True).
    """

    permission_classes = [IsAdminUserOrReadOnly]

    def get(self, request):
        """
        Retorna a lista de todas as áreas cadastradas.
        """
        areas = Area.objects.all().select_related('bloco')
        serializer = AreaSerializer(areas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Cria um novo registro de Área no sistema.
        """
        serializer = AreaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AreaDetailView(APIView):
    """
    View para consulta, atualização e remoção de uma Área específica.

    Permissões:
    - GET: Acesso público (leitura).
    - PUT / PATCH / DELETE: Restrito a usuários administradores (is_staff=True).
    """

    permission_classes = [IsAdminUserOrReadOnly]

    def get(self, request, pk):
        """
        Retorna os detalhes de uma área específica pelo ID.
        """
        area = get_object_or_404(Area.objects.select_related('bloco'), pk=pk)
        serializer = AreaSerializer(area)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        """
        Atualiza completamente uma área existente.
        """
        area = get_object_or_404(Area, pk=pk)
        serializer = AreaSerializer(area, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        """
        Atualiza parcialmente os campos de uma área existente.
        """
        area = get_object_or_404(Area, pk=pk)
        serializer = AreaSerializer(area, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        """
        Remove uma área do sistema.
        """
        area = get_object_or_404(Area, pk=pk)
        area.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)