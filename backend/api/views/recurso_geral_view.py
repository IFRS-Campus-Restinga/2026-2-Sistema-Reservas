from rest_framework.generics import *
from api.models.recurso_geral import RecursoGeral
from api.serializers.recurso_geral_serializer import RecursoGeralSerializer

class RecursoGeralListCreateView(ListCreateAPIView):
    queryset = RecursoGeral.objects.all()
    serializer_class = RecursoGeralSerializer

class RecursoGeralDetailView(RetrieveAPIView):
    queryset = RecursoGeral.objects.all()
    serializer_class = RecursoGeralSerializer