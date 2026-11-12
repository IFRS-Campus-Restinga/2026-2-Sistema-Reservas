import styles from './Skeleton.module.css';

/**
 * Estrutura de todos os skeletons: cuida da acessibilidade e do atraso de 200 ms.
 *
 * Props:
 * - rotulo (opcional): texto lido pelo leitor de tela, ex.: "Carregando áreas...".
 *   Sem rótulo o skeleton é só decorativo; use quando a tela já anuncia o carregamento em outro lugar.
 * - className (opcional): classes do contêiner externo.
 * - classeVisual (opcional): classes do contêiner dos blocos (ex.: a lista da tela).
 */
function SkeletonBase({ rotulo, className, classeVisual = '', children }) {
  const acessibilidade = rotulo
    ? { role: 'status', 'aria-busy': true }
    : { 'aria-hidden': true };

  return (
    <div {...acessibilidade} className={className}>
      {rotulo && <span className="visually-hidden">{rotulo}</span>}
      <div aria-hidden="true" className={`placeholder-glow ${styles.visual} ${classeVisual}`}>
        {children}
      </div>
    </div>
  );
}

export default SkeletonBase;
