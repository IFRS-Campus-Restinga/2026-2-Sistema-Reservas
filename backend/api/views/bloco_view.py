"""
View para gerenciamento do CRUD de Bloco.
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from api.models.bloco_model import Bloco
from api.serializers.bloco_serializer import BlocoSerializer
from api.permissions.is_admin_or_read_only import IsAdminUserOrReadOnly


class BlocoListCreateView(APIView):
    """
    View para listagem e criação de Blocos.

    Permissões:
    - GET: Acesso público (leitura).
    - POST: Restrito a usuários administradores (is_staff=True).
    """

    permission_classes = [IsAdminUserOrReadOnly]

    def get(self, request):
        """
        Retorna a lista de todos os blocos cadastrados.
        """
        blocos = Bloco.objects.all()
        serializer = BlocoSerializer(blocos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Cria um novo registro de Bloco no sistema.
        """
        serializer = BlocoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BlocoDetailView(APIView):
    """
    View para consulta, atualização e remoção de um Bloco específico.

    Permissões:
    - GET: Acesso público (leitura).
    - PUT / PATCH / DELETE: Restrito a usuários administradores (por enquanto) (is_staff=True).
    """

    permission_classes = [IsAdminUserOrReadOnly]

    def get(self, request, pk):
        """
        Retorna os detalhes de um bloco específico pelo ID.
        """
        bloco = get_object_or_404(Bloco, pk=pk)
        serializer = BlocoSerializer(bloco)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        """
        Atualiza completamente um bloco existente.
        """
        bloco = get_object_or_404(Bloco, pk=pk)
        serializer = BlocoSerializer(bloco, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        """
        Atualiza parcialmente os campos de um bloco existente.
        """
        bloco = get_object_or_404(Bloco, pk=pk)
        serializer = BlocoSerializer(bloco, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        """
        Remove um bloco do sistema.
        """
        bloco = get_object_or_404(Bloco, pk=pk)
        bloco.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)