import { X } from 'lucide-react';
import { useId, useImperativeHandle, useState } from 'react';
import useFocoModal from '../../../hooks/useFocoModal';
import styles from './Modal.module.css';

/*
 * Clicar fora do modal não fecha mais: só o X, o Esc ou o botão Cancelar.
 *
 * confirmarDescarte: quando true, o modal observa os campos do formulário.
 * Se o usuário alterou algo e tenta fechar, pede confirmação antes de descartar.
 *
 * ref (opcional): expõe fechar() para o botão Cancelar passar pela mesma confirmação:
 *   const controleModal = useRef(null);
 *   <Modal ref={controleModal} ...>
 *   <button onClick={() => controleModal.current?.fechar()}>Cancelar</button>
 */
function Modal({
    ref,
    aberto,
    titulo,
    aoFechar,
    children,
    rodape,
    variante = 'padrao',
    processando = false,
    confirmarDescarte = false,
}) {
    const tituloId = useId();
    const [alterado, setAlterado] = useState(false);
    const [confirmandoSaida, setConfirmandoSaida] = useState(false);
    const [abertoAnterior, setAbertoAnterior] = useState(aberto);

    // Ao abrir/fechar, zera o controle de alterações (padrão do React para resetar estado por prop).
    if (aberto !== abertoAnterior) {
        setAbertoAnterior(aberto);
        setAlterado(false);
        setConfirmandoSaida(false);
    }

    function fechar() {
        if (processando) return;
        if (confirmandoSaida) {
            setConfirmandoSaida(false);
            return;
        }
        if (confirmarDescarte && alterado) {
            setConfirmandoSaida(true);
            return;
        }
        aoFechar?.();
    }

    function descartar() {
        setConfirmandoSaida(false);
        aoFechar?.();
    }

    function marcarAlterado() {
        if (confirmarDescarte && !alterado) setAlterado(true);
    }

    useImperativeHandle(ref, () => ({ fechar }));

    const modalRef = useFocoModal({ aberto, aoFechar: fechar, bloqueado: processando });

    if (!aberto) {
        return null;
    }

    return (
        <div className={`${styles.fundo} ${styles[variante] ?? ''}`}>
            <div
                className={styles.modal}
                ref={modalRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby={tituloId}
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

                {/* hidden em vez de desmontar: o formulário mantém o que foi digitado se o usuário voltar */}
                <div
                    className={styles.conteudo}
                    hidden={confirmandoSaida}
                    onChange={marcarAlterado}
                    onInput={marcarAlterado}
                >
                    {children}
                </div>

                {rodape && (
                    <div className={styles.rodape} hidden={confirmandoSaida}>
                        {rodape}
                    </div>
                )}

                {confirmandoSaida && (
                    <div className={styles.confirmarSaida} role="alertdialog" aria-live="assertive">
                        <p>Deseja mesmo sair? Os dados preenchidos e não salvos serão perdidos.</p>
                        <div className={styles.acoesSaida}>
                            <button type="button" className={styles.continuar} onClick={() => setConfirmandoSaida(false)} autoFocus>
                                Continuar editando
                            </button>
                            <button type="button" className={styles.descartar} onClick={descartar}>
                                Sair sem salvar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Modal;
