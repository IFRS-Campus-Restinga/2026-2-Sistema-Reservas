from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response

class BuscarObjetoComPermissaoMixin:
    queryset = None

    def get_queryset(self):
        return self.queryset

    def get_object(self, pk):
        obj = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(self.request, obj)
        return obj


def listar(queryset, serializer_class):
    serializer = serializer_class(queryset, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


def detalhar(instance, serializer_class):
    return Response(serializer_class(instance).data, status=status.HTTP_200_OK)


def criar(request, serializer_class, context=None, **campos_extra):
    serializer = serializer_class(data=request.data, context=context or {})
    if serializer.is_valid():
        serializer.save(**campos_extra)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def atualizar(request, instance, serializer_class, partial=False):
    serializer = serializer_class(instance, data=request.data, partial=partial)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def remover(instance):
    instance.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
