from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from api.permissions.regras_comuns import SomenteAdministrador
from api.services.relatorio_uso_service import gerar_relatorio


class RelatorioUsoView(APIView):
    permission_classes = [SomenteAdministrador]

    def get(self, request):
        inicio = parse_date(request.query_params.get('data_inicio', ''))
        fim = parse_date(request.query_params.get('data_fim', ''))
        if not inicio or not fim:
            raise ValidationError({'detail': 'Informe o período inicial e final.'})
        if fim < inicio:
            raise ValidationError({'data_fim': 'A data final deve ser igual ou posterior à inicial.'})
        if (fim - inicio).days > 366:
            raise ValidationError({'data_fim': 'O relatório pode abranger no máximo 367 dias.'})
        for campo in ('bloco', 'tipo_recurso', 'recurso'):
            if request.query_params.get(campo):
                try:
                    if int(request.query_params[campo]) < 1:
                        raise ValueError
                except ValueError:
                    raise ValidationError({campo: 'Informe um identificador válido.'})
        dados = gerar_relatorio(request.query_params, inicio, fim)
        dados['filtros'] = dict(request.query_params.items())
        dados['gerado_em'] = timezone.localtime()
        dados['gerado_por'] = request.user.nome or request.user.email
        return Response(dados)
