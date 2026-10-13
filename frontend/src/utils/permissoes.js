// As permissões vêm calculadas do backend em /session/me/ (usuario.permissoes).
// Aqui só servem para exibir ou ocultar telas e ações; quem garante é a API.

import { TIPO_RECURSO_RESERVAVEL } from './tipoRecursoReservavel';

export const ehAdministrador = (usuario) => Boolean(usuario?.permissoes?.administrador);

export const podeCriarGrupo = (usuario, tipoMembro) =>
  Boolean(usuario?.permissoes?.criar_grupos_de?.includes(tipoMembro));

export const podeGerenciarGrupos = (usuario) => (usuario?.permissoes?.criar_grupos_de?.length ?? 0) > 0;

export const podeReservar = (usuario, tipoRecurso) =>
  Boolean(usuario?.permissoes?.reservar_sem_grupo?.includes(tipoRecurso)) ||
  Boolean(usuario?.autorizacoes?.some((autorizacao) => autorizacao.tipo_recurso_autorizado === tipoRecurso));

export const podeReservarArea = (usuario) => podeReservar(usuario, TIPO_RECURSO_RESERVAVEL.AREA);

export const podeReservarVeiculo = (usuario) => podeReservar(usuario, TIPO_RECURSO_RESERVAVEL.VEICULO);

export const podeReservarRecursoGeral = (usuario) => podeReservar(usuario, TIPO_RECURSO_RESERVAVEL.RECURSO_GERAL);

export const temPermissao = (usuario, regra) => !regra || Boolean(regra(usuario));
