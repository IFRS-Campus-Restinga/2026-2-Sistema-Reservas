export const ACAO_AUDITORIA_LABEL = {
  CRIAR: "Criou",
  EDITAR: "Editou",
  EXCLUIR: "Excluiu",
  CANCELAR: "Cancelou",
  SINCRONIZAR: "Sincronizou",
};

export const ENTIDADE_AUDITORIA_LABEL = {
  RESERVA_AREA: "Reserva de área",
  RESERVA_VEICULO: "Reserva de veículo",
  RESERVA_RECURSO_GERAL: "Reserva de recurso geral",
  RECORRENCIA_RESERVA_AREA: "Recorrência de reserva de área",
  GRUPO: "Grupo",
  MEMBRO_GRUPO: "Membro de grupo",
  RECURSO_GERAL: "Recurso geral",
  TIPO_RECURSO: "Tipo de recurso",
  AREA: "Área",
  BLOCO: "Bloco",
  VEICULO: "Veículo",
  TIMETABLE: "Timetable",
};

const ACAO_MEMBRO_LABEL = {
  CRIAR: "Adicionou membro",
  EXCLUIR: "Removeu membro",
};

export function rotuloAcaoAuditoria(log) {
  if (log.entidade === "MEMBRO_GRUPO" && ACAO_MEMBRO_LABEL[log.acao]) {
    return ACAO_MEMBRO_LABEL[log.acao];
  }
  return ACAO_AUDITORIA_LABEL[log.acao] ?? log.acao;
}

export function formatarDataHoraAuditoria(dataISO) {
  return new Date(dataISO).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatarValorAuditoria(valor) {
  if (valor === null || valor === undefined || valor === "") return "-";
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  if (Array.isArray(valor)) return valor.length ? valor.join(", ") : "-";
  if (typeof valor === "object") return JSON.stringify(valor);

  const texto = String(valor);
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const [ano, mes, dia] = texto.split("-");
    return `${dia}/${mes}/${ano}`;
  }
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(texto)) return texto.slice(0, 5);
  return texto;
}

export const LIMITE_LISTA_AUDITORIA = 5;
export const ITENS_VISIVEIS_LISTA_AUDITORIA = 3;

function valorCampoAuditoria(valor) {
  if (Array.isArray(valor) && valor.length > 0) return valor.map(formatarValorAuditoria);
  return formatarValorAuditoria(valor);
}

function rotuloCampo(campo, rotulos) {
  if (rotulos?.[campo]) return rotulos[campo];
  const texto = campo.replaceAll("_", " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function camposAuditoria(log) {
  const antes = log.dados_antes ?? {};
  const depois = log.dados_depois ?? {};
  const comparavel = Boolean(log.dados_antes && log.dados_depois);
  const campos = [...new Set([...Object.keys(antes), ...Object.keys(depois)])];

  return campos.map((campo) => ({
    campo,
    rotulo: rotuloCampo(campo, log.rotulos),
    antes: log.dados_antes ? valorCampoAuditoria(antes[campo]) : "-",
    depois: log.dados_depois ? valorCampoAuditoria(depois[campo]) : "-",
    alterado: comparavel && JSON.stringify(antes[campo]) !== JSON.stringify(depois[campo]),
  }));
}
