from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from api.serializers.reserva_recurso_geral_serializer import ReservaRecursoGeralSerializer
from api.models.reserva_recurso_geral_model import ReservaRecursoGeral
from django.db import transaction
from api.models.recurso_geral_model import RecursoGeral
from api.validators.reserva_recurso_geral_validator import validar_disponibilidade

class ReservaRecursoGeralListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reservas = ReservaRecursoGeral.objects.filter(
            usuario=request.user
        ).order_by("-data", "-horario_inicio")

        serializer = ReservaRecursoGeralSerializer(reservas, many=True)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    def post(self, request):
        serializer = ReservaRecursoGeralSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            dados = serializer.validated_data

            recurso = get_object_or_404(RecursoGeral.objects.select_for_update(), pk=dados["recurso_geral"].pk)

            dados["recurso_geral"] = recurso
            validar_disponibilidade(dados)
            serializer.save(usuario=request.user)

            return Response(serializer.data, status=status.HTTP_201_CREATED)



class ReservaRecursoGeralDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        reserva = get_object_or_404(ReservaRecursoGeral, pk=pk, usuario=request.user)

        serializer = ReservaRecursoGeralSerializer(reserva)

        return Response(serializer.data, status=status.HTTP_200_OK)