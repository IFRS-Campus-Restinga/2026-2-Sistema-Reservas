import { Trash2 } from 'lucide-react';
import Modal from '../Modal/Modal';

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
            titulo={titulo}
            aoFechar={aoCancelar}
            rodape={
                <>
                    <button
                        type="button"
                        onClick={aoCancelar}
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        onClick={aoConfirmar}
                    >
                        Excluir
                    </button>
                </>
            }
        >
            <div>
                <Trash2 size={24} />

                <p>{mensagem}</p>

                {aviso && (
                    <p>{aviso}</p>
                )}
            </div>
        </Modal>
    );
}

export default ModalConfirmacao;
