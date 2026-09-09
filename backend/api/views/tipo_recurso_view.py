from rest_framework.generics import CreateAPIView
from api.models.tipo_recurso import TipoRecurso
from api.serializers.tipo_recurso_serializer import TipoRecursoSerializer


class TipoRecursoCreateView(CreateAPIView):
    queryset = TipoRecurso.objects.all()
    serializer_class = TipoRecursoSerializer