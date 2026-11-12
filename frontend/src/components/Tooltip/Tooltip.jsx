import { useId } from 'react';
import { OverlayTrigger, Tooltip as BootstrapTooltip } from 'react-bootstrap';
import styles from './Tooltip.module.css';

const CONFIG_POPPER = {
  strategy: 'fixed',
  modifiers: [
    {
      name: 'preventOverflow',
      options: {
        boundary: 'viewport',
        padding: 8,
      },
    },
  ],
};

function Tooltip({
  texto,
  children,
  posicao = 'top',
  desabilitado = false,
  className = '',
  delay = { show: 200, hide: 80 },
}) {
  const id = useId();

  if (!texto) {
    return children;
  }

  const gatilho = desabilitado ? (
    <span
      className={`${styles.gatilhoDesabilitado} ${className}`.trim()}
      tabIndex={0}
      aria-label={typeof texto === 'string' ? texto : undefined}
    >
      {children}
    </span>
  ) : (
    children
  );

  return (
    <OverlayTrigger
      placement={posicao}
      delay={delay}
      trigger={['hover', 'focus']}
      popperConfig={CONFIG_POPPER}
      overlay={
        <BootstrapTooltip id={`tooltip-${id}`} className={styles.tooltip}>
          {texto}
        </BootstrapTooltip>
      }
    >
      {gatilho}
    </OverlayTrigger>
  );
}

export default Tooltip;
