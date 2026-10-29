import useListaPaginada from '../../../hooks/useListaPaginada';
import Paginacao from '../Paginacao/Paginacao';
import { useState } from 'react';
import { Eye } from 'lucide-react';
import styles from './ReservasAdmin.module.css';

import { confirmarReservaPendente, cancelarReservaAdmin } from '../../../services';
import CampoBusca from '../CampoBusca/CampoBusca';
import TabelaAdministracao from '../TabelaAdmin/TabelaAdmin';
import Select from '../../Select/Select';
import ModalReservaPendente from './ModalReservaPendente/ModalReservaPendente';
import RelatorioUso from '../RelatorioUso/RelatorioUso';

const MODALIDADE_LABEL = {
  area: 'Área',
  veiculo: 'Veículo',
  recurso_geral: 'Recurso geral',
};

function formatarData(data) {
  if (!data) return '—';

  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR');
}

function formatarHorario(horario) {
  return horario ? horario.slice(0, 5) : '—';
}

function ReservasAdmin() {
  const [busca, setBusca] = useState('');
  const [modalidade, setModalidade] = useState('todas');
  const [erroConfirmacao, setErroConfirmacao] = useState('');
  const [erroCancelamento, setErroCancelamento] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [reservaSelecionada, setReservaSelecionada] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [cancelandoId, setCancelandoId] = useState(null);

  const { itens: reservasFiltradas, carregando, erro, recarregar, paginacao } = useListaPaginada('/api/reservas/pendentes/', { busca, modalidade });

  async function confirmarReserva(reserva) {
    if (!reserva || confirmandoId) return;

    try {
      setConfirmandoId(reserva.id);
      setErroConfirmacao('');
      setMensagemSucesso('');

      await confirmarReservaPendente(reserva.id);

      recarregar();
      setReservaSelecionada(null);
      setMensagemSucesso(`Reserva "${reserva.nome}" confirmada com sucesso.`);
    } catch (erro) {
      console.error(erro);
      setErroConfirmacao(
        erro.message || 'Não foi possível confirmar a reserva.'
      );
    } finally {
      setConfirmandoId(null);
    }
  }

  async function cancelarReserva(reserva, motivo) {
    if (!reserva || confirmandoId || cancelandoId) return;

    try {
      setCancelandoId(reserva.id);
      setErroCancelamento('');
      setErroConfirmacao('');
      setMensagemSucesso('');

      await cancelarReservaAdmin(reserva.id, motivo);

      recarregar();

      setReservaSelecionada(null);

      setMensagemSucesso(
        `Reserva "${reserva.nome}" cancelada com sucesso.`
      );
    } catch (erro) {
      console.error(erro);

      setErroCancelamento(
        erro.message || 'Não foi possível cancelar a reserva.'
      );
    } finally {
      setCancelandoId(null);
    }
  }

  function abrirDetalhes(reserva) {
    setErroConfirmacao('');
    setErroCancelamento('');
    setReservaSelecionada(reserva);
  }

  function fecharDetalhes() {
    if (confirmandoId || cancelandoId) return;
    setErroConfirmacao('');
    setErroCancelamento('');
    setReservaSelecionada(null);
  }

  const colunas = [
    {
      chave: 'solicitante',
      titulo: 'Solicitante',
      renderizar: (reserva) => (
        <div className={styles.dadoPrincipal}>
          <span>{reserva.usuario?.nome || 'Não informado'}</span>
          <small>{reserva.usuario?.email || '—'}</small>
        </div>
      ),
    },
    {
      chave: 'item',
      titulo: 'Reserva',
      renderizar: (reserva) => (
        <div className={styles.dadoPrincipal}>
          <span>{reserva.item?.nome || reserva.nome}</span>
          <small>{reserva.nome}</small>
        </div>
      ),
    },
    {
      chave: 'modalidade',
      titulo: 'Tipo',
      renderizar: (reserva) => (
        <span className={styles.modalidade} data-modalidade={reserva.modalidade}>
          {MODALIDADE_LABEL[reserva.modalidade] || 'Reserva'}
        </span>
      ),
    },
    {
      chave: 'data',
      titulo: 'Data',
      renderizar: (reserva) => formatarData(reserva.data),
    },
    {
      chave: 'horario',
      titulo: 'Horário',
      renderizar: (reserva) =>
        `${formatarHorario(reserva.horario_inicio)} - ${formatarHorario(reserva.horario_fim)}`,
    },
    {
      chave: 'status',
      titulo: 'Status',
      renderizar: () => (
        <span className={styles.status}>Pendente</span>
      ),
    },
    {
      chave: 'acao',
      titulo: 'Ação',
      renderizar: (reserva) => (
        <button
          type="button"
          className={styles.detalhes}
          onClick={() => abrirDetalhes(reserva)}
          title="Ver detalhes"
          aria-label={`Ver detalhes da reserva ${reserva.nome}`}
        >
          <Eye size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className={styles.reservas}>
      <div className={styles.cabecalhoSecao}>
        <div>
          <h2>Reservas pendentes</h2>
          <p>Solicitações que ainda aguardam análise do administrador.</p>
        </div>

        <RelatorioUso />
      </div>

      <div className={styles.filtros}>
        <CampoBusca
          valor={busca}
          aoAlterar={setBusca}
          placeholder="Buscar por usuário, reserva ou recurso..."
        />

        <Select
          valor={modalidade}
          aoAlterar={setModalidade}
          valorTodos="todas"
          rotuloTodos="Todos os tipos"
          ariaLabel="Filtrar reservas por tipo"
          opcoes={[
            { valor: 'area', rotulo: 'Áreas' },
            { valor: 'veiculo', rotulo: 'Veículos' },
            { valor: 'recurso_geral', rotulo: 'Recursos gerais' },
          ]}
        />
      </div>

      {mensagemSucesso && (
        <p className={styles.sucesso} role="status">{mensagemSucesso}</p>
      )}

      {erro && (
        <p className={styles.erro} role="alert">{erro}</p>
      )}

      {carregando ? (
        <p className={styles.carregando} role="status">Carregando reservas pendentes...</p>
      ) : (
        <TabelaAdministracao
          colunas={colunas}
          dados={reservasFiltradas}
          mensagemVazia={
            busca.trim() || modalidade !== 'todas'
              ? 'Nenhuma reserva pendente encontrada para os filtros selecionados.'
              : 'Nenhuma reserva pendente no momento.'
          }
        />
      )}

      <Paginacao {...paginacao} />

      <ModalReservaPendente
        reserva={reservaSelecionada}
        aberto={Boolean(reservaSelecionada)}
        aoFechar={fecharDetalhes}
        aoConfirmar={confirmarReserva}
        confirmando={confirmandoId === reservaSelecionada?.id}
        erroConfirmacao={erroConfirmacao}
        aoCancelar={cancelarReserva}
        cancelando={cancelandoId === reservaSelecionada?.id}
        erroCancelamento={erroCancelamento}
      />
    </div>
  );
}

export default ReservasAdmin;
