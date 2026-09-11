"""
View para gerenciamento do CRUD de Bloco.
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from api.models.bloco import Bloco
from api.serializers.bloco import BlocoSerializer


class BlocoListCreateView(APIView):
    def get(self, request):
        blocos = Bloco.objects.all()
        serializer = BlocoSerializer(blocos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = BlocoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BlocoDetailView(APIView):
    def get(self, request, pk):
        bloco = get_object_or_404(Bloco, pk=pk)
        serializer = BlocoSerializer(bloco)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        bloco = get_object_or_404(Bloco, pk=pk)
        serializer = BlocoSerializer(bloco, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        bloco = get_object_or_404(Bloco, pk=pk)
        serializer = BlocoSerializer(bloco, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        bloco = get_object_or_404(Bloco, pk=pk)
        bloco.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)