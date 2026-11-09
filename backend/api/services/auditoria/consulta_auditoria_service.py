from django.db.models import Q

from api.models.log_auditoria_model import LogAuditoria
from api.services.filtros_listagem import periodo_do_parametro


def filtrar_logs_auditoria(parametros):
    logs = LogAuditoria.objects.select_related('responsavel', 'usuario_afetado').order_by('-data', '-id')

    responsavel = parametros.get('responsavel', '').strip()
    if responsavel:
        logs = logs.filter(Q(responsavel__nome__icontains=responsavel) | Q(responsavel__email__icontains=responsavel))

    if parametros.get('perfil_responsavel'):
        logs = logs.filter(perfil_responsavel=parametros['perfil_responsavel'])

    usuario_afetado = parametros.get('usuario_afetado', '').strip()
    if usuario_afetado:
        logs = logs.filter(Q(usuario_afetado__nome__icontains=usuario_afetado) | Q(usuario_afetado__email__icontains=usuario_afetado))

    if parametros.get('acao'):
        logs = logs.filter(acao=parametros['acao'])

    if parametros.get('entidade'):
        logs = logs.filter(entidade=parametros['entidade'])

    data_inicio, data_fim = periodo_do_parametro(parametros)
    if data_inicio:
        logs = logs.filter(data__date__gte=data_inicio)
    if data_fim:
        logs = logs.filter(data__date__lte=data_fim)

    return logs

