from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from api.models.recurso_geral_model import RecursoGeral
from api.serializers.recurso_geral_serializer import RecursoGeralSerializer


class RecursoGeralListCreateView(APIView):
    def get(self, request):
        recursos = RecursoGeral.objects.all()
        serializer = RecursoGeralSerializer(recursos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = RecursoGeralSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RecursoGeralDetailView(APIView):
    def get(self, request, pk):
        recurso = get_object_or_404(RecursoGeral, pk=pk)
        serializer = RecursoGeralSerializer(recurso)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        recurso = get_object_or_404(RecursoGeral, pk=pk)
        serializer = RecursoGeralSerializer(recurso, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        recurso = get_object_or_404(RecursoGeral, pk=pk)
        serializer = RecursoGeralSerializer(recurso, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        recurso = get_object_or_404(RecursoGeral, pk=pk)
        recurso.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
