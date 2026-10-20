from rest_framework import serializers

from api.models.reserva_model import Reserva


class ReservaPendenteSerializer(serializers.ModelSerializer):
    usuario = serializers.SerializerMethodField()
    modalidade = serializers.SerializerMethodField()
    item = serializers.SerializerMethodField()
    detalhes = serializers.SerializerMethodField()

    class Meta:
        model = Reserva
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
            "modalidade",
            "item",
            "detalhes",
        ]

    def _reserva_especifica(self, reserva):
        for atributo in ("reservaarea", "reservaveiculo", "reservarecursogeral"):
            especifica = getattr(reserva, atributo, None)
            if especifica is not None:
                return atributo, especifica
        return None, None

    def get_usuario(self, reserva):
        return {
            "id": reserva.usuario_id,
            "nome": reserva.usuario.nome,
            "email": reserva.usuario.email,
            "papel": reserva.usuario.papel,
        }

    def get_modalidade(self, reserva):
        atributo, _ = self._reserva_especifica(reserva)
        return {
            "reservaarea": "area",
            "reservaveiculo": "veiculo",
            "reservarecursogeral": "recurso_geral",
        }.get(atributo)

    def get_item(self, reserva):
        atributo, especifica = self._reserva_especifica(reserva)

        if atributo == "reservaarea":
            area = especifica.area
            return {
                "id": area.id,
                "nome": area.nome,
                "bloco": area.bloco.nome,
            }

        if atributo == "reservaveiculo":
            veiculo = especifica.veiculo
            return {
                "id": veiculo.id,
                "nome": veiculo.nome,
                "placa": veiculo.placa,
                "modelo": veiculo.modelo,
            }

        if atributo == "reservarecursogeral":
            recurso = especifica.recurso_geral
            return {
                "id": recurso.id,
                "nome": recurso.nome,
                "tipo": recurso.tipo_recurso.descricao,
                "categoria": recurso.tipo_recurso.categoria,
            }

        return None

    def get_detalhes(self, reserva):
        atributo, especifica = self._reserva_especifica(reserva)

        if atributo == "reservaarea":
            return {
                "aula": especifica.aula,
            }

        if atributo == "reservaveiculo":
            return {
                "destino": especifica.destino,
                "finalidade": especifica.finalidade,
                "quantidade_passageiros": especifica.quantidade_passageiros,
                "data_devolucao_prevista": especifica.data_devolucao_prevista,
            }

        if atributo == "reservarecursogeral":
            return {
                "quantidades": especifica.quantidades,
                "data_devolucao_prevista": especifica.data_devolucao_prevista,
            }

        return {}
