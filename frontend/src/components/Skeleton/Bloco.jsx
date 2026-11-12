import { Placeholder } from 'react-bootstrap';
import styles from './Skeleton.module.css';

// Retângulo cinza do skeleton. Largura e altura aceitam número (px) ou texto ("60%").
export function Bloco({ largura = '100%', altura = 12, raio = 4, className = '' }) {
  return (
    <Placeholder
      className={`${styles.bloco} ${className}`}
      style={{ width: largura, height: altura, borderRadius: raio }}
    />
  );
}

// Linha de texto: reserva a altura da linha real e centraliza as barras dentro dela.
export function Linha({ altura = 18, className = '', children }) {
  return (
    <div className={`${styles.linha} ${className}`} style={{ height: altura }}>
      {children}
    </div>
  );
}
