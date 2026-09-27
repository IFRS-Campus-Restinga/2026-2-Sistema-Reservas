// As permissões vêm calculadas do backend em /session/me/ (usuario.permissoes).
// Aqui só servem para exibir ou ocultar telas e ações; quem garante é a API.

export const ehAdministrador = (usuario) => Boolean(usuario?.permissoes?.administrador);

export const podeCriarGrupo = (usuario, tipoMembro) =>
  Boolean(usuario?.permissoes?.criar_grupos_de?.includes(tipoMembro));

export const podeGerenciarGrupos = (usuario) => (usuario?.permissoes?.criar_grupos_de?.length ?? 0) > 0;
