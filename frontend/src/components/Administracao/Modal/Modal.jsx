import { X } from 'lucide-react';
import { useId } from 'react';
import useFocoModal from '../../../hooks/useFocoModal';
import styles from './Modal.module.css';

function Modal({
    aberto,
    titulo,
    aoFechar,
    children,
    rodape,
    variante = 'padrao',
    processando = false,
}) {
    const tituloId = useId();
    const modalRef = useFocoModal({ aberto, aoFechar, bloqueado: processando });

    function fechar() {
        if (!processando) aoFechar();
    }

    if (!aberto) {
        return null;
    }

    return (
        <div
            className={`${styles.fundo} ${styles[variante] ?? ''}`}
            onMouseDown={fechar}
        >
            <div
                className={styles.modal}
                ref={modalRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby={tituloId}
                onMouseDown={(evento) => evento.stopPropagation()}
            >
                <div className={styles.cabecalho}>
                    <h2 id={tituloId}>{titulo}</h2>

                    <button
                        type="button"
                        onClick={fechar}
                        disabled={processando}
                        aria-label="Fechar"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.conteudo}>
                    {children}
                </div>

                {rodape && (
                    <div className={styles.rodape}>
                        {rodape}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Modal;
