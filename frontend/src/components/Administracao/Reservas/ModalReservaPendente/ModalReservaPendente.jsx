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

function ModalReservaPendente({ aberto, reserva, aoFechar }) {
  if (!reserva) return null;

  const detalhes = reserva.detalhes || {};
  const item = reserva.item || {};

  return (
    <Modal
      aberto={aberto}
      titulo="Detalhes da reserva"
      variante="largo"
      aoFechar={aoFechar}
      rodape={
        <button type="button" className={styles.fechar} onClick={aoFechar}>
          Fechar
        </button>
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
