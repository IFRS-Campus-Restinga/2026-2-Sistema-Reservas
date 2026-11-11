from django.db.models import Count, Q
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction

from api.models.grupo_model import Grupo
from api.permissions.grupo_permissions import PodeCriarGrupo, PodeGerenciarGrupo, tipos_grupo_que_pode_criar
from api.permissions.regras_comuns import usuario_e_admin
from api.serializers.grupo_serializer import GrupoSerializer, CopiaGrupoSerializer
from api.models.membro_grupo_model import MembroGrupo
from api.enumerations.auditoria_enumerations import AcaoAuditoria
from api.services.auditoria import foto, registrar_auditoria
from .view_helpers import BuscarObjetoComPermissaoMixin, listar, detalhar, criar, atualizar, remover

class GrupoListCreateView(APIView):
    permission_classes = [PodeCriarGrupo]

    def get(self, request):
        queryset = (
            Grupo.objects.select_related('criador').prefetch_related('autorizacoes__tipo_recurso')
            .annotate(quantidade_membros=Count('membros', filter=Q(membros__excluido_em__isnull=True), distinct=True))
            .order_by('id')
        )
        apenas_meus = request.query_params.get('meus') == 'true'
        if apenas_meus or not usuario_e_admin(request.user):
            queryset = queryset.filter(criador=request.user)
        return listar(request, queryset, GrupoSerializer)

    def post(self, request):
        return criar(request, GrupoSerializer, criador=request.user)


class GrupoDetailView(BuscarObjetoComPermissaoMixin, APIView):
    permission_classes = [PodeGerenciarGrupo]
    queryset = Grupo.objects.select_related('criador').prefetch_related('autorizacoes__tipo_recurso')

    def get(self, request, pk):
        return detalhar(self.get_object(pk), GrupoSerializer)

    def put(self, request, pk):
        return atualizar(request, self.get_object(pk), GrupoSerializer)

    def patch(self, request, pk):
        return atualizar(request, self.get_object(pk), GrupoSerializer, partial=True)

    def delete(self, request, pk):
        return remover(request, self.get_object(pk))


class GrupoCopiarView(BuscarObjetoComPermissaoMixin, APIView):
    permission_classes = [PodeGerenciarGrupo, PodeCriarGrupo]
    queryset = Grupo.objects.select_related('criador').prefetch_related('autorizacoes__tipo_recurso')

    def post(self, request, pk):
        origem = self.get_object(pk)
        if origem.tipo_membro_permitido not in tipos_grupo_que_pode_criar(request.user):
            raise PermissionDenied('Você não tem permissão para copiar este tipo de grupo.')
        if request.data.get('tipo_membro_permitido', origem.tipo_membro_permitido) != origem.tipo_membro_permitido:
            raise ValidationError({'tipo_membro_permitido': 'A cópia deve manter o tipo de membro do grupo original.'})

        dados = {
            'nome': f'Cópia de {origem.nome}'[:100],
            'tipo_membro_permitido': origem.tipo_membro_permitido,
            'data_inicio_validade': origem.data_inicio_validade,
            'data_fim_validade': origem.data_fim_validade,
            'tipos_recurso_autorizados': origem.tipos_recurso_autorizados,
            'tipos_recurso': [tipo.pk for tipo in origem.tipos_recurso],
        }
        for campo in (*dados, 'incluir_membros'):
            if campo in request.data:
                dados[campo] = request.data[campo]
        serializer = CopiaGrupoSerializer(data=dados)
        serializer.is_valid(raise_exception=True)
        incluir_membros = serializer.validated_data.pop('incluir_membros')

        try:
            with transaction.atomic():
                copia = serializer.save(criador=request.user)
                registrar_auditoria(request.user, AcaoAuditoria.CRIAR, copia,
                                    descricao=f'Cópia do grupo {origem.nome} (ID {origem.pk})', depois=foto(copia))
                if incluir_membros:
                    for membro in origem.membros.select_related('usuario'):
                        try:
                            novo_membro = MembroGrupo.objects.create(
                                grupo=copia, usuario=membro.usuario,
                                data_fim_validade=membro.data_fim_validade,
                            )
                        except DjangoValidationError as exc:
                            raise ValidationError({'incluir_membros':
                                f'Não foi possível copiar {membro.usuario.nome or membro.usuario.email}: '
                                + ' '.join(exc.messages)}) from exc
                        registrar_auditoria(request.user, AcaoAuditoria.CRIAR, novo_membro, depois=foto(novo_membro))
        except DjangoValidationError as exc:
            raise ValidationError(exc.message_dict if hasattr(exc, 'message_dict') else exc.messages) from exc
        return Response(GrupoSerializer(copia).data, status=status.HTTP_201_CREATED)
