import { X } from 'lucide-react';
import styles from './Modal.module.css';

function Modal({
    aberto,
    titulo,
    aoFechar,
    children,
    rodape,
    variante = 'padrao',
}) {
    if (!aberto) {
        return null;
    }

    return (
        <div
            className={`${styles.fundo} ${styles[variante] ?? ''}`}
            onMouseDown={aoFechar}
        >
            <div
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                onMouseDown={(evento) => evento.stopPropagation()}
            >
                <div className={styles.cabecalho}>
                    <h2>{titulo}</h2>

                    <button
                        type="button"
                        onClick={aoFechar}
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
