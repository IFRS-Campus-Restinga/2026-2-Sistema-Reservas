from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from api.models.tipo_recurso_model import TipoRecurso
from api.serializers.tipo_recurso_serializer import TipoRecursoSerializer

class TipoRecursoCreateView(APIView):
    def get(self, request):
        tipos = TipoRecurso.objects.all()
        serializer = TipoRecursoSerializer(tipos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = TipoRecursoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
