from django.contrib.auth import get_user_model

CAMPOS_IGNORADOS_NA_FOTO = {'excluido_em', 'duracao'}


def foto(objeto):
    return {
        campo.name: _valor_legivel(objeto, campo)
        for campo in objeto._meta.concrete_fields
        if not campo.primary_key and campo.name not in CAMPOS_IGNORADOS_NA_FOTO
    }


def foto_agrupada(fotos):
    agrupada = {}

    for campo in fotos[0] if fotos else {}:
        valores = []
        for item in fotos:
            if item[campo] not in valores:
                valores.append(item[campo])
        agrupada[campo] = valores[0] if len(valores) == 1 else valores

    return agrupada


def _valor_legivel(objeto, campo):
    if campo.is_relation:
        relacionado = getattr(objeto, campo.name)
        if relacionado is None:
            return None
        if isinstance(relacionado, get_user_model()):
            return relacionado.nome or relacionado.email
        return str(relacionado)
    if campo.choices:
        return getattr(objeto, f'get_{campo.name}_display')()
    return campo.value_from_object(objeto)
