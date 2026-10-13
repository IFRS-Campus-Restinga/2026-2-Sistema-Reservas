from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from api.permissions.regras_comuns import UsuarioAutenticado

class DataAtualView(APIView):
    permission_classes = [UsuarioAutenticado]

    def get(self, request):
        agora = timezone.localtime()
        return Response({
            "data": agora.date().isoformat(),
            "hora": agora.strftime("%H:%M"),
        })
