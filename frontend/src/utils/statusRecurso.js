export const STATUS_RECURSO_LABEL = {
  ATIVO: "Ativo",
  MANUTENCAO: "Manutenção",
  INATIVO: "Inativo",
};

export const OPCOES_STATUS_RECURSO = Object.entries(STATUS_RECURSO_LABEL)
  .map(([valor, rotulo]) => ({ valor, rotulo }));
