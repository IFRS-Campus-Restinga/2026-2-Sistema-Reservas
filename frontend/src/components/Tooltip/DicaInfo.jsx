import { Info } from 'lucide-react';
import Tooltip from './Tooltip';
import styles from './Tooltip.module.css';

function DicaInfo({ texto, rotulo, posicao = 'top' }) {
  if (!texto) return null;

  return (
    <Tooltip texto={texto} posicao={posicao}>
      <button
        type="button"
        className={styles.dicaBotao}
        aria-label={rotulo || (typeof texto === 'string' ? texto : 'Mais informações')}
      >
        <Info size={14} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}

export default DicaInfo;
