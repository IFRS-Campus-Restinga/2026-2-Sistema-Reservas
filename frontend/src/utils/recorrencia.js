import { dataParaISO, diferencaEmDias, somarDias } from './data';

export const TIPO_RECORRENCIA = {
  DIARIA: 'DIARIA',
  SEMANAL: 'SEMANAL',
  QUINZENAL: 'QUINZENAL',
  MENSAL: 'MENSAL',
};

export const TIPO_RECORRENCIA_LABEL = {
  DIARIA: 'Diária',
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
};

// Formato aceito pelo componente Select
export const OPCOES_RECORRENCIA = [
  TIPO_RECORRENCIA.SEMANAL,
  TIPO_RECORRENCIA.DIARIA,
  TIPO_RECORRENCIA.QUINZENAL,
  TIPO_RECORRENCIA.MENSAL,
].map((tipo) => ({ valor: tipo, rotulo: TIPO_RECORRENCIA_LABEL[tipo] }));

// Mesmo limite validado pelo backend
export const LIMITE_DIAS_RECORRENCIA = 365;

const INTERVALO_DIAS = {
  DIARIA: 1,
  SEMANAL: 7,
  QUINZENAL: 14,
};

function gerarDatasMensais(dataInicio, dataFim) {
  const [ano, mes, dia] = dataInicio.split('-').map(Number);
  const datas = [];

  for (let meses = 0; ; meses += 1) {
    const ultimoDiaDoMes = new Date(ano, mes + meses, 0).getDate();
    const data = dataParaISO(new Date(ano, mes - 1 + meses, Math.min(dia, ultimoDiaDoMes)));

    if (data > dataFim) return datas;

    datas.push(data);
  }
}

// ("2026-09-01", "SEMANAL", "2026-09-15") -> ["2026-09-01", "2026-09-08", "2026-09-15"]
export function gerarDatasRecorrencia(dataInicio, tipo, dataFim) {
  if (!dataInicio || !dataFim || dataFim < dataInicio) return [];
  if (diferencaEmDias(dataInicio, dataFim) > LIMITE_DIAS_RECORRENCIA) return [];

  if (tipo === TIPO_RECORRENCIA.MENSAL) return gerarDatasMensais(dataInicio, dataFim);

  const datas = [];

  for (let data = dataInicio; data <= dataFim; data = somarDias(data, INTERVALO_DIAS[tipo])) {
    datas.push(data);
  }

  return datas;
}

// Retorna a mensagem de erro ou '' quando a recorrência é válida
export function validarRecorrencia(dataInicio, tipo, dataFim) {

  if (!dataInicio) return 'Escolha a data da primeira reserva.';

  if (dataFim <= dataInicio) {
    return 'A data final da recorrência deve ser posterior à data da reserva.';
  }

  if (diferencaEmDias(dataInicio, dataFim) > LIMITE_DIAS_RECORRENCIA) {
    return `A recorrência pode durar no máximo ${LIMITE_DIAS_RECORRENCIA} dias.`;
  }

  if (gerarDatasRecorrencia(dataInicio, tipo, dataFim).length < 2) {
    return 'O período informado deve gerar pelo menos duas reservas.';
  }

  return '';
}

// Campo "recorrencia" enviado no payload de criação
export function montarRecorrencia(ativa, tipo, dataFim, pularConflitos = false) {
  if (!ativa) return null;

  return pularConflitos
    ? { tipo, data_fim: dataFim, pular_conflitos: true }
    : { tipo, data_fim: dataFim };
}

// Mensagens devolvidas pelo backend ao recusar a recorrência ("19/10/2026: motivo")
export function conflitosRecorrencia(erro) {
  const conflitos = erro?.dados?.recorrencia;

  return Array.isArray(conflitos) ? conflitos : [];
}

// Datas "AAAA-MM-DD" que podem ser puladas para criar a recorrência mesmo assim
export function datasConflitantesRecorrencia(erro) {
  const datas = erro?.dados?.datas_conflitantes;

  return Array.isArray(datas) ? datas : [];
}
