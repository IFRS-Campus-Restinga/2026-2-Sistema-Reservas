import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, Car, CheckCircle, Clock, Fuel, Gauge, Users } from 'lucide-react';

import ReservaVeiculoModal from '../../components/ReservaVeiculo/ReservaVeiculoModal';
import { buscarVeiculo, buscarVeiculos } from '../../services';
import { buscarAgendaVeiculo } from '../../services/reservasVeiculos';
import { STATUS_RECURSO_LABEL } from '../../utils/statusRecurso';
import styles from './VeiculoDetalhe.module.css';

function dataHora(data, horario) {
  return new Date(`${data}T${String(horario).slice(0, 8)}`);
}

function formatarIntervalo(reserva) {
  const inicio = dataHora(reserva.data, reserva.horario_inicio);
  const fim = dataHora(reserva.data_devolucao_prevista, reserva.horario_fim);
  const mesmoDia = reserva.data === reserva.data_devolucao_prevista;
  const horas = (valor) => valor.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (mesmoDia) return `${horas(inicio)}–${horas(fim)}`;
  return `${inicio.toLocaleDateString('pt-BR')} ${horas(inicio)} – ${fim.toLocaleDateString('pt-BR')} ${horas(fim)}`;
}

function VeiculoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useOutletContext();
  const [veiculo, setVeiculo] = useState(null);
  const [veiculos, setVeiculos] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [mostrarReserva, setMostrarReserva] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    Promise.all([buscarVeiculo(id), buscarVeiculos(), buscarAgendaVeiculo(id)])
      .then(([dadosVeiculo, listaVeiculos, dadosAgenda]) => {
        setVeiculo(dadosVeiculo);
        setVeiculos(listaVeiculos);
        setAgenda(dadosAgenda);
        setErro('');
      })
      .catch(() => setErro('Veículo não encontrado.'))
      .finally(() => setCarregando(false));
  }, [id]);

  if (carregando) return <p className="text-muted p-4" role="status">Carregando veículo...</p>;
  if (erro || !veiculo) return <p className="text-danger p-4" role="alert">{erro}</p>;

  const podeSolicitar = usuario?.papel === 'servidor' || usuario?.papel === 'admin';
  const agora = new Date();
  const reservaAtual = agenda.find((reserva) =>
    dataHora(reserva.data, reserva.horario_inicio) <= agora &&
    dataHora(reserva.data_devolucao_prevista, reserva.horario_fim) > agora
  );
  const proxima = agenda
    .filter((reserva) => dataHora(reserva.data, reserva.horario_inicio) > agora)
    .sort((a, b) => dataHora(a.data, a.horario_inicio) - dataHora(b.data, b.horario_inicio))[0];

  return (
    <div className="p-3 p-md-4">
      <button type="button"
        className={`btn btn-link p-0 mb-3 d-inline-flex align-items-center gap-2 text-decoration-none ${styles.voltar}`}
        onClick={() => navigate('/veiculos')}>
        <ArrowLeft size={16} /> Voltar para veículos
      </button>

      <div className="bg-white rounded-4 border overflow-hidden">
        <div className={`px-4 py-5 text-white ${styles.cabecalho}`}>
          <div className="d-flex align-items-start gap-3">
            <div className="d-flex align-items-center justify-content-center rounded-3 bg-white bg-opacity-25 flex-shrink-0" style={{ width: 56, height: 56 }}>
              <Car size={28} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge rounded-pill bg-white bg-opacity-25 text-white">{veiculo.placa}</span>
                {veiculo.status !== 'ATIVO' && (
                  <span className="badge rounded-pill bg-warning text-dark">{STATUS_RECURSO_LABEL[veiculo.status]}</span>
                )}
              </div>
              <h2 className="fw-bold mb-1">{veiculo.nome}</h2>
              <p className="text-white-50 mb-2">{veiculo.marca} {veiculo.modelo} · {veiculo.cor}</p>
              <div className="d-flex flex-wrap align-items-center gap-3 small">
                <span className="d-flex align-items-center gap-1"><Users size={14} /> {veiculo.capacidade} lugares</span>
                <span className="d-flex align-items-center gap-1"><Fuel size={14} /> {veiculo.combustivel}</span>
                <span className="d-flex align-items-center gap-1"><Gauge size={14} /> {Number(veiculo.quilometragem).toLocaleString('pt-BR')} km</span>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4 p-4">
          <div className="col-md-6">
            <h3 className="fs-6 fw-semibold mb-2">Informações</h3>
            <p className="small text-muted mb-3">{veiculo.observacao || 'Nenhuma observação cadastrada.'}</p>
            <div className="border-top pt-3 d-flex align-items-center gap-2 small text-muted">
              <Clock size={14} className="text-success" />
              {reservaAtual
                ? `Em uso até ${new Date(`${reservaAtual.data_devolucao_prevista}T12:00:00`).toLocaleDateString('pt-BR')} às ${String(reservaAtual.horario_fim).slice(0, 5)}`
                : proxima
                  ? `Disponível agora · próxima saída às ${String(proxima.horario_inicio).slice(0, 5)}`
                  : 'Disponível agora'}
            </div>
          </div>

          <div className="col-md-6">
            <h3 className="fs-6 fw-semibold mb-2">Agenda de hoje</h3>
            {agenda.length === 0 ? (
              <div className="bg-success-subtle rounded-3 p-3 text-center">
                <CheckCircle size={20} className="text-success d-block mx-auto mb-1" />
                <p className="small text-success-emphasis fw-medium mb-0">Disponível o dia todo</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {agenda.map((reserva) => (
                  <div className={styles.itemAgenda} key={reserva.id}>
                    <span className={styles.barra} />
                    <div>
                      <strong className="small d-block">{reserva.nome}</strong>
                      <span className="text-muted d-block">{formatarIntervalo(reserva)} · {reserva.usuario_nome}</span>
                      <span className="text-muted d-block">Destino: {reserva.destino}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {veiculo.status === 'ATIVO' && (
          <div className="px-4 pb-4">
            {podeSolicitar ? (
              <button type="button" className="btn btn-success w-100 py-2 fw-semibold rounded-3"
                onClick={() => setMostrarReserva(true)}>
                Reservar {veiculo.nome}
              </button>
            ) : (
              <p className="small text-warning-emphasis bg-warning-subtle border border-warning-subtle rounded-3 px-3 py-2 text-center mb-0">
                Reservas de veículos são exclusivas para servidores autorizados.
              </p>
            )}
          </div>
        )}
      </div>

      <ReservaVeiculoModal aberto={mostrarReserva} veiculoInicial={veiculo} veiculos={veiculos}
        aoFechar={() => setMostrarReserva(false)}
        aoReservar={() => navigate('/minhas-reservas', { state: { criada: true, tipo: 'veiculo' } })} />
    </div>
  );
}

export default VeiculoDetalhe;
