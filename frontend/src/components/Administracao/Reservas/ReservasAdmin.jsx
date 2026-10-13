import { useEffect, useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import styles from './ReservasAdmin.module.css';

import { listarReservasPendentes, confirmarReservaPendente, cancelarReservaAdmin } from '../../../services';
import CampoBusca from '../CampoBusca/CampoBusca';
import TabelaAdministracao from '../TabelaAdmin/TabelaAdmin';
import Select from '../../Select/Select';
import ModalReservaPendente from './ModalReservaPendente/ModalReservaPendente';

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
  const [reservas, setReservas] = useState([]);
  const [busca, setBusca] = useState('');
  const [modalidade, setModalidade] = useState('todas');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [erroConfirmacao, setErroConfirmacao] = useState('');
  const [erroCancelamento, setErroCancelamento] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [reservaSelecionada, setReservaSelecionada] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [cancelandoId, setCancelandoId] = useState(null);

  useEffect(() => {
    let ativo = true;

    async function carregarReservas() {
      try {
        const dados = await listarReservasPendentes();

        if (ativo) {
          setReservas(Array.isArray(dados) ? dados : []);
        }
      } catch (erro) {
        console.error(erro);

        if (ativo) {
          setErro(erro.message || 'Não foi possível carregar as reservas pendentes.');
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarReservas();

    return () => {
      ativo = false;
    };
  }, []);

  async function confirmarReserva(reserva) {
    if (!reserva || confirmandoId) return;

    try {
      setConfirmandoId(reserva.id);
      setErroConfirmacao('');
      setMensagemSucesso('');

      await confirmarReservaPendente(reserva.id);

      setReservas((reservasAtuais) =>
        reservasAtuais.filter((item) => item.id !== reserva.id)
      );
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

      setReservas((reservasAtuais) =>
        reservasAtuais.filter((item) => item.id !== reserva.id)
      );

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

  const reservasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return reservas.filter((reserva) => {
      const correspondeModalidade =
        modalidade === 'todas' || reserva.modalidade === modalidade;

      if (!correspondeModalidade) return false;
      if (!termo) return true;

      const campos = [
        reserva.nome,
        reserva.usuario?.nome,
        reserva.usuario?.email,
        reserva.item?.nome,
        reserva.item?.tipo,
        reserva.item?.placa,
        MODALIDADE_LABEL[reserva.modalidade],
      ];

      return campos.some((campo) =>
        String(campo ?? '').toLowerCase().includes(termo)
      );
    });
  }, [reservas, busca, modalidade]);

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
          onClick={() => setReservaSelecionada(reserva)}
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

        <span className={styles.contador}>
          {reservasFiltradas.length} {reservasFiltradas.length === 1 ? 'reserva' : 'reservas'}
        </span>
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
