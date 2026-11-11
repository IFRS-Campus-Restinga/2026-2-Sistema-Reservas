from django.utils import timezone
from rest_framework import serializers
from accounts.models import HubUser
from api.models.area_model import Area
from api.models.reserva_area_model import ReservaArea
from .recorrencia_serializer import RecorrenciaSerializer, validar_recorrencia


class AreaResumoSerializer(serializers.ModelSerializer):
    bloco_nome = serializers.CharField(source="bloco.nome", read_only=True)

    class Meta:
        model = Area
        fields = ["id", "nome", "capacidade", "tipo", "bloco", "bloco_nome"]


class UsuarioResumoSerializer(serializers.ModelSerializer):
    class Meta:
        model = HubUser
        fields = ["nome", "perfil_acesso"]


class ReservaAreaSerializer(serializers.ModelSerializer):
    usuario_detalhe = UsuarioResumoSerializer(source="usuario", read_only=True)
    area_detalhe = AreaResumoSerializer(source="area", read_only=True)
    recorrencia = RecorrenciaSerializer(required=False, allow_null=True)
    professor = serializers.SerializerMethodField()

    class Meta:
        model = ReservaArea
        fields = [
            "id",
            "nome",
            "descricao",
            "status",
            "data",
            "horario_inicio",
            "horario_fim",
            "duracao",
            "tipo_reserva",
            "usuario",
            "usuario_detalhe",
            "area",
            "area_detalhe",
            "aula",
            "celula_timetable",
            "professor",
            "recorrencia",
        ]
        read_only_fields = ["id", "status", "duracao", "usuario", "celula_timetable"]

    def get_professor(self, obj):
        if getattr(obj, "celula_timetable", None):
            return obj.celula_timetable.professor or None
        return None

    def validate(self, dados):
        def valor(campo):
            return dados.get(campo, getattr(self.instance, campo, None))

        data = valor("data")
        inicio = valor("horario_inicio")
        fim = valor("horario_fim")
        agora = timezone.localtime()

        if data < agora.date():
            raise serializers.ValidationError(
                {"data": "Não é possível reservar uma data passada."}
            )

        if data == agora.date() and inicio <= agora.time().replace(tzinfo=None):
            raise serializers.ValidationError(
                {"horario_inicio": "O horário de início deve ser posterior ao horário atual."}
            )

        if fim <= inicio:
            raise serializers.ValidationError(
                {"horario_fim": "O horário de fim deve ser posterior ao início."}
            )

        recorrencia = dados.get("recorrencia")

        if recorrencia:
            validar_recorrencia(data, recorrencia)

        return dados
