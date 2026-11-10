const ANO_MINIMO = 1000;
const ANO_MAXIMO = 9999;

export function dataCompleta(valor) {
  if (!valor) return false;
  const ano = Number(valor.split('-')[0]);
  return ano >= ANO_MINIMO && ano <= ANO_MAXIMO;
}

export function ajustarPeriodo(periodo, campoAlterado) {
  const { inicio, fim } = periodo;
  if (!dataCompleta(inicio) || !dataCompleta(fim) || inicio <= fim) return periodo;
  return campoAlterado === 'inicio' ? { inicio, fim: inicio } : { inicio: fim, fim };
}
