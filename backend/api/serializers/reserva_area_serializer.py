from django.utils import timezone
from rest_framework import serializers
from accounts.models import HubUser
from api.models.area_model import Area
from api.models.reserva_area_model import ReservaArea


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
            "aula"
        ]
        read_only_fields = ["id", "status", "duracao", "usuario"]

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

        return dados
