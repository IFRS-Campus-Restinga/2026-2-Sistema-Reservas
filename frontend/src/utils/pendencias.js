export const EVENTO_PENDENCIAS_ATUALIZADAS = 'reservas:pendencias-atualizadas';

export function avisarAtualizacaoPendencias() {
  window.dispatchEvent(new Event(EVENTO_PENDENCIAS_ATUALIZADAS));
}
