import { Trash2 } from 'lucide-react';
import Modal from '../Modal/Modal';
import styles from './ModalConfirmacao.module.css';

function ModalConfirmacao({
    aberto,
    titulo = 'Excluir item?',
    mensagem,
    aviso,
    aoCancelar,
    aoConfirmar,
}) {
    return (
        <Modal
            aberto={aberto}
            variante="confirmacao"
            titulo={
                <span className={styles.titulo}>
                    <span className={styles.icone}>
                        <Trash2 size={20} aria-hidden="true" />
                    </span>
                    {titulo}
                </span>
            }
            aoFechar={aoCancelar}
            rodape={
                <>
                    <button
                        type="button"
                        className={styles.cancelar}
                        onClick={aoCancelar}
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        className={styles.excluir}
                        onClick={aoConfirmar}
                    >
                        Excluir
                    </button>
                </>
            }
        >
            <div className={styles.conteudo}>
                <p className={styles.mensagem}>{mensagem}</p>

                {aviso && (
                    <p className={styles.aviso}>{aviso}</p>
                )}
            </div>
        </Modal>
    );
}

export default ModalConfirmacao;
