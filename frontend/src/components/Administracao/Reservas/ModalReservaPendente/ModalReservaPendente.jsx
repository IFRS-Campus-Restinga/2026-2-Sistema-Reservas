import { useEffect, useState } from 'react';
import { Check, XCircle } from 'lucide-react';
import Modal from '../../Modal/Modal';
import styles from './ModalReservaPendente.module.css';

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

function CampoDetalhe({ rotulo, valor }) {
  return (
    <div className={styles.campo}>
      <span>{rotulo}</span>
      <strong>{valor || '—'}</strong>
    </div>
  );
}

function ModalReservaPendente({ aberto, reserva, aoFechar, aoConfirmar, confirmando = false, erroConfirmacao = '', aoCancelar, cancelando = false, erroCancelamento = '',}) {
  const [modoCancelamento, setModoCancelamento] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [erroMotivo, setErroMotivo] = useState('');

  useEffect(() => {
    if (aberto) {
      setModoCancelamento(false);
      setMotivo('');
      setErroMotivo('');
    }
  }, [aberto, reserva?.id]);
  if (!reserva) return null;

  const detalhes = reserva.detalhes || {};
  const item = reserva.item || {};
  const ocupado = confirmando || cancelando;
  const erroAcao = erroConfirmacao || erroCancelamento || erroMotivo;

  function iniciarCancelamento() {
    setErroMotivo('');
    setModoCancelamento(true);
  }

  function voltarDoCancelamento() {
    if (ocupado) return;

    setErroMotivo('');
    setModoCancelamento(false);
  }

  function confirmarCancelamento() {
    const motivoLimpo = motivo.trim();

    if (!motivoLimpo) {
      setErroMotivo('Informe o motivo do cancelamento.');
      return;
    }

    setErroMotivo('');
    aoCancelar?.(reserva, motivoLimpo);
  }

  return (
    <Modal
      aberto={aberto}
      titulo="Detalhes da reserva"
      variante="largo"
      aoFechar={ocupado ? undefined : aoFechar}
      rodape={modoCancelamento ? (
        <div className={styles.acoes}>
            <button
              type="button"
              className={styles.fechar}
              onClick={voltarDoCancelamento}
              disabled={ocupado}
            >
              Voltar
            </button>

            <button
              type="button"
              className={styles.cancelarConfirmacao}
              onClick={confirmarCancelamento}
              disabled={ocupado}
            >
              <XCircle size={16} />
              {cancelando ? 'Cancelando...' : 'Confirmar rejeição'}
            </button>
          </div>
        ) : (
          <div className={styles.acoes}>
            <button
              type="button"
              className={styles.fechar}
              onClick={aoFechar}
              disabled={ocupado}
            >
              Fechar
            </button>

            <button
              type="button"
              className={styles.cancelar}
              onClick={iniciarCancelamento}
              disabled={ocupado}
            >
              <XCircle size={16} />
              Rejeitar solicitação
            </button>

            <button
              type="button"
              className={styles.confirmar}
              onClick={() => aoConfirmar?.(reserva)}
              disabled={ocupado}
            >
              <Check size={16} />
              {confirmando ? 'Confirmando...' : 'Confirmar reserva'}
            </button>
          </div>
        )
      }
    >
      <div className={styles.conteudo}>
        <div className={styles.destaque}>
          <div>
            <span className={styles.tipo}>
              {MODALIDADE_LABEL[reserva.modalidade] || 'Reserva'}
            </span>
            <h3>{reserva.nome}</h3>
            <p>{item.nome || 'Item não informado'}</p>
          </div>

          <span className={styles.status}>Pendente</span>
        </div>

        {erroAcao && (
          <p className={styles.erro} role="alert">
            {erroAcao}
          </p>
        )}

        {modoCancelamento && (
          <section className={styles.blocoCancelamento}>
            <div>
              <h4>Motivo do cancelamento *</h4>
              <p>
                O solicitante receberá esse motivo na notificação.
              </p>
            </div>

            <textarea
              value={motivo}
              onChange={(evento) => {
                setMotivo(evento.target.value);

                if (erroMotivo) {
                  setErroMotivo('');
                }
              }}
              placeholder="Explique por que a reserva está sendo cancelada..."
              maxLength={500}
              rows={4}
              disabled={ocupado}
            />

            <small>{motivo.length}/500</small>
          </section>
        )}

        <section className={styles.secao}>
          <h4>Solicitante</h4>
          <div className={styles.grade}>
            <CampoDetalhe rotulo="Nome" valor={reserva.usuario?.nome} />
            <CampoDetalhe rotulo="E-mail" valor={reserva.usuario?.email} />
          </div>
        </section>

        <section className={styles.secao}>
          <h4>Período</h4>
          <div className={styles.grade}>
            <CampoDetalhe rotulo="Data" valor={formatarData(reserva.data)} />
            <CampoDetalhe
              rotulo="Horário"
              valor={`${formatarHorario(reserva.horario_inicio)} - ${formatarHorario(reserva.horario_fim)}`}
            />
            {detalhes.data_devolucao_prevista && (
              <CampoDetalhe
                rotulo="Devolução prevista"
                valor={formatarData(detalhes.data_devolucao_prevista)}
              />
            )}
          </div>
        </section>

        <section className={styles.secao}>
          <h4>Recurso reservado</h4>
          <div className={styles.grade}>
            <CampoDetalhe rotulo="Item" valor={item.nome} />
            {item.bloco && <CampoDetalhe rotulo="Bloco" valor={item.bloco} />}
            {item.tipo && <CampoDetalhe rotulo="Tipo" valor={item.tipo} />}
            {item.categoria && <CampoDetalhe rotulo="Categoria" valor={item.categoria} />}
            {item.placa && <CampoDetalhe rotulo="Placa" valor={item.placa} />}
            {item.modelo && <CampoDetalhe rotulo="Modelo" valor={item.modelo} />}
            {detalhes.quantidades != null && (
              <CampoDetalhe rotulo="Quantidade" valor={String(detalhes.quantidades)} />
            )}
            {detalhes.quantidade_passageiros != null && (
              <CampoDetalhe
                rotulo="Passageiros"
                valor={String(detalhes.quantidade_passageiros)}
              />
            )}
          </div>
        </section>

        {(reserva.descricao || detalhes.destino || detalhes.finalidade) && (
          <section className={styles.secao}>
            <h4>Informações adicionais</h4>
            <div className={styles.grade}>
              {detalhes.destino && <CampoDetalhe rotulo="Destino" valor={detalhes.destino} />}
              {detalhes.finalidade && <CampoDetalhe rotulo="Finalidade" valor={detalhes.finalidade} />}
              {reserva.descricao && (
                <div className={`${styles.campo} ${styles.campoLargo}`}>
                  <span>Descrição</span>
                  <strong>{reserva.descricao}</strong>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}

export default ModalReservaPendente;
