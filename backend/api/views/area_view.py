from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models.area_model import Area
from api.permissions.escrita_admin import EscritaAdmin
from api.serializers.area_serializer import AreaSerializer


class AreaListCreateView(APIView):
    permission_classes = [EscritaAdmin]

    def get(self, request):
        areas = Area.objects.all().select_related('bloco')
        serializer = AreaSerializer(areas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = AreaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
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
        serializer = AreaSerializer(area, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        area = get_object_or_404(Area, pk=pk)
        serializer = AreaSerializer(area, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        area = get_object_or_404(Area, pk=pk)
        area.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)