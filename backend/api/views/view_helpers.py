from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response

from api.pagination import PaginacaoPadrao

class BuscarObjetoComPermissaoMixin:
    queryset = None

    def get_queryset(self):
        return self.queryset

    def get_object(self, pk):
        obj = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(self.request, obj)
        return obj


def listar(request, queryset, serializer_class):
    paginator = PaginacaoPadrao()
    pagina = paginator.paginate_queryset(queryset, request)
    serializer = serializer_class(pagina, many=True)
    return paginator.get_paginated_response(serializer.data)


def detalhar(instance, serializer_class):
    return Response(serializer_class(instance).data, status=status.HTTP_200_OK)


def _salvar(serializer, **campos_extra):
    try:
        serializer.save(**campos_extra)
    except DjangoValidationError as exc:
        detail = exc.message_dict if hasattr(exc, 'message_dict') else {'detail': exc.messages}
        return Response(detail, status=status.HTTP_400_BAD_REQUEST)
    except IntegrityError:
        return Response(
            {'detail': 'Este registro conflita com um já existente.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return None


def criar(request, serializer_class, context=None, **campos_extra):
    serializer = serializer_class(data=request.data, context=context or {})
    if serializer.is_valid():
        erro = _salvar(serializer, **campos_extra)
        if erro:
            return erro
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def atualizar(request, instance, serializer_class, partial=False):
    serializer = serializer_class(instance, data=request.data, partial=partial)
    if serializer.is_valid():
        erro = _salvar(serializer)
        if erro:
            return erro
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def remover(instance):
    instance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
