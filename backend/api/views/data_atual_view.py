from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from hub_integrations.authentication import HubJWTAuthenticationOpcional

class DataAtualView(APIView):
    authentication_classes = [HubJWTAuthenticationOpcional]
    permission_classes = [AllowAny]

    def get(self, request):
        agora = timezone.localtime()
        return Response({
            "data": agora.date().isoformat(),
            "hora": agora.strftime("%H:%M"),
        })
