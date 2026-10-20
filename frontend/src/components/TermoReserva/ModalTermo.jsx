import { useState } from 'react';
import Modal from '../Administracao/Modal/Modal';
import TermoReserva from './TermoReserva';

export default function ModalTermo({ reserva, rejeitar = false, tipoDocumento = 'responsabilidade', aoFechar, aoAtualizar }) {
  const [processando, setProcessando] = useState(false);
  const titulos = {
    responsabilidade: 'Termo de responsabilidade',
    retirada: 'Termo de retirada de veículo',
    devolucao: 'Termo de devolução de veículo',
  };

  return (
    <Modal aberto titulo={titulos[tipoDocumento] || titulos.responsabilidade} variante="termo"
      processando={processando} aoFechar={aoFechar}>
      <TermoReserva reservaId={reserva.id} modalidade={reserva.modalidade}
        tipoDocumento={tipoDocumento}
        administrativo rejeitarInicialmente={rejeitar}
        aoProcessar={setProcessando} aoAtualizar={aoAtualizar} />
    </Modal>
  );
}
