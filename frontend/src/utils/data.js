// "2026-09-17" -> "17 set"
export function formatarDataCurta(dataISO) {
  const data = new Date(`${dataISO}T00:00:00`);
  return data
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    .replace(".", "");
}

// Monta "AAAA-MM-DD"
export function dataParaISO(data) {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${data.getFullYear()}-${mes}-${dia}`;
}

// ("2026-09-17", 1) -> "2026-09-18"
export function somarDias(dataISO, dias) {
  const data = new Date(`${dataISO}T12:00:00`);
  data.setDate(data.getDate() + dias);

  return dataParaISO(data);
}

// ("2026-09-17", "2026-09-20") -> 3
export function diferencaEmDias(dataInicioISO, dataFimISO) {
  const inicio = new Date(`${dataInicioISO}T12:00:00`);
  const fim = new Date(`${dataFimISO}T12:00:00`);

  return Math.round((fim - inicio) / (24 * 60 * 60 * 1000));
}

// Segunda a domingo da semana que contém a data informada
export function diasDaSemana(dataISO) {
  const diaDaSemana = new Date(`${dataISO}T12:00:00`).getDay();
  const segunda = somarDias(dataISO, diaDaSemana === 0 ? -6 : 1 - diaDaSemana);

  return Array.from({ length: 7 }, (_, indice) => somarDias(segunda, indice));
}

// "08:30" ou "08:30:00" -> 510
export function horarioParaMinutos(horario) {
  const [horas, minutos] = horario.split(":").map(Number);

  return horas * 60 + minutos;
}
