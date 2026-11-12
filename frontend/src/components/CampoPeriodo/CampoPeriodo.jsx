import { useState } from 'react';
import { ajustarPeriodo, dataCompleta } from '../../utils/periodo';
import styles from './CampoPeriodo.module.css';

function CampoPeriodo({ inicio, fim, aoAlterar, ariaLabel = 'Período' }) {
  const [rascunho, setRascunho] = useState({ inicio, fim });
  const [recebido, setRecebido] = useState({ inicio, fim });

  if (recebido.inicio !== inicio || recebido.fim !== fim) {
    setRecebido({ inicio, fim });
    setRascunho({ inicio, fim });
  }

  function alterar(campo, valor) {
    setRascunho((atual) => ({ ...atual, [campo]: valor }));
    if (valor === '' || dataCompleta(valor)) aoAlterar({ inicio, fim, [campo]: valor });
  }

  function confirmar(campo) {
    if (rascunho[campo] && !dataCompleta(rascunho[campo])) {
      setRascunho({ inicio, fim });
      return;
    }
    const ajustado = ajustarPeriodo({ inicio, fim }, campo);
    if (ajustado.inicio !== inicio || ajustado.fim !== fim) aoAlterar(ajustado);
  }

  return (
    <div className={styles.periodo} role="group" aria-label={ariaLabel}>
      <input
        type="date"
        className={styles.data}
        value={rascunho.inicio}
        max={fim || undefined}
        aria-label="Data inicial"
        onChange={(evento) => alterar('inicio', evento.target.value)}
        onBlur={() => confirmar('inicio')}
      />
      <span className={styles.separador}>até</span>
      <input
        type="date"
        className={styles.data}
        value={rascunho.fim}
        min={inicio || undefined}
        aria-label="Data final"
        onChange={(evento) => alterar('fim', evento.target.value)}
        onBlur={() => confirmar('fim')}
      />
    </div>
  );
}

export default CampoPeriodo;
