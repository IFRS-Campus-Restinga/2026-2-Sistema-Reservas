import { useEffect, useRef } from 'react';

const FOCAVEIS = 'button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]';

export default function useFocoModal({ aberto = true, aoFechar, bloqueado = false }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.activeElement;
    const primeiro = modalRef.current?.querySelector(FOCAVEIS);
    primeiro?.focus();
    return () => {
      if (anterior?.isConnected) anterior.focus();
    };
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    function aoPressionar(evento) {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        if (!bloqueado) aoFechar();
      }
      if (evento.key !== 'Tab') return;
      const elementos = [...(modalRef.current?.querySelectorAll(FOCAVEIS) || [])]
        .filter((elemento) => elemento.getClientRects().length > 0);
      const primeiro = elementos[0];
      const ultimo = elementos.at(-1);
      if (!primeiro) {
        evento.preventDefault();
        modalRef.current?.focus();
      } else if (!modalRef.current.contains(document.activeElement)) {
        evento.preventDefault();
        primeiro.focus();
      } else if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }
    document.addEventListener('keydown', aoPressionar);
    return () => document.removeEventListener('keydown', aoPressionar);
  }, [aberto, aoFechar, bloqueado]);

  return modalRef;
}
