from rest_framework.generics import *
from api.models.recurso_geral import RecursoGeral
from api.serializers.recurso_geral_serializer import RecursoGeralSerializer

class RecursoGeralCreateView(CreateAPIView):
    queryset = RecursoGeral.objects.all()
    serializer_class = RecursoGeralSerializer


