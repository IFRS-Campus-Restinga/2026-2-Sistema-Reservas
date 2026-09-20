from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models.veiculo_model import Veiculo
from api.serializers.veiculo_serializer import VeiculoSerializer


class VeiculoCreateView(APIView):
    def get(self, request):
        veiculos = Veiculo.objects.all().order_by("id")
        serializer = VeiculoSerializer(veiculos, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = VeiculoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VeiculoDetailView(APIView):
    def get(self, request, pk):
        veiculo = get_object_or_404(Veiculo, pk=pk)
        serializer = VeiculoSerializer(veiculo)
        return Response(serializer.data)

    def put(self, request, pk):
        veiculo = get_object_or_404(Veiculo, pk=pk)
        serializer = VeiculoSerializer(veiculo, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        veiculo = get_object_or_404(Veiculo, pk=pk)
        serializer = VeiculoSerializer(veiculo, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        veiculo = get_object_or_404(Veiculo, pk=pk)
        veiculo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
