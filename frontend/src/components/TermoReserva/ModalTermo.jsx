import { useState } from 'react';
import Modal from '../Administracao/Modal/Modal';
import TermoReserva from './TermoReserva';

export default function ModalTermo({ reserva, rejeitar = false, aoFechar, aoAtualizar }) {
  const [processando, setProcessando] = useState(false);

  return (
    <Modal aberto titulo="Termo de responsabilidade" variante="termo"
      processando={processando} aoFechar={aoFechar}>
      <TermoReserva reservaId={reserva.id} modalidade={reserva.modalidade}
        administrativo rejeitarInicialmente={rejeitar}
        aoProcessar={setProcessando} aoAtualizar={aoAtualizar} />
    </Modal>
  );
}
