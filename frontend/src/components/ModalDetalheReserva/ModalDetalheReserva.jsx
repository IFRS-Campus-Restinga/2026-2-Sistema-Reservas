import { useState } from 'react';
import { CalendarCheck, Clock, Globe, Info, MapPin, Pencil, Repeat, Trash2, UserRound, X } from 'lucide-react';
import useFocoModal from '../../hooks/useFocoModal';
import TermoReserva from '../TermoReserva/TermoReserva';
import { TIPO_RECORRENCIA_LABEL } from '../../utils/recorrencia';
import { STATUS_RESERVA_LABEL, statusReservaApresentado } from '../../utils/reserva';
import styles from './ModalDetalheReserva.module.css';
import ModalConfirmacao from '../Administracao/ModalConfirmacao/ModalConfirmacao';

function dataFormatada(data) {
  if (!data) return 'Não informada';
  return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR');
}

function ModalDetalheReserva({
  reserva,
  modalidade,
  item,
  responsavel,
  periodo,
  detalhes = [],
  exigeTermo = false,
  aoAtualizarTermo,
  administrativo = false,
  acoesAdministrativas,
  conteudoExtra,
  aoEditar,
  aoCancelar,
  motivoAcoesIndisponiveis,
  aoFechar,
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');
  const [enviandoTermo, setEnviandoTermo] = useState(false);
  const bloqueado = processando || enviandoTermo;
  const modalRef = useFocoModal({ aberto: Boolean(reserva) && !confirmando, aoFechar, bloqueado });

  if (!reserva) return null;

  const tipo = String(reserva.tipo_reserva || '').toLowerCase();
  const status = statusReservaApresentado(reserva);
  const podeCancelar = Boolean(aoCancelar);

  function fechar() {
    if (!bloqueado) aoFechar();
  }

  async function cancelar() {
    try {
      setProcessando(true);
      setErro('');
      await aoCancelar();
    } catch (falha) {
      setErro(falha.message || 'Não foi possível cancelar a reserva.');
    } finally {
      setProcessando(false);
    }
  }

  if (confirmando) {
    return (
      <ModalConfirmacao
        aberto
        titulo="Cancelar reserva?"
        mensagem={`Tem certeza que deseja cancelar a reserva ${reserva.nome}?`}
        aviso={erro}
        textoConfirmar="Confirmar"
        processando={processando}
        aoCancelar={() => {
          setConfirmando(false);
          setErro('');
        }}
        aoConfirmar={cancelar}
      />
    );
  }

  return (
    <div className={styles.fundo} onMouseDown={fechar}>
      <div
        className={styles.modal}
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-detalhe-reserva"
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <header className={styles.cabecalho} data-tipo={tipo}>
          <div>
            <span className={styles.sobretitulo}>{modalidade}</span>
            <h2 id="titulo-detalhe-reserva">{reserva.nome}</h2>
            <div className={styles.etiquetas}>
              <span className={styles.status}>{STATUS_RESERVA_LABEL[status] || reserva.status}</span>
              {tipo === 'externa' && <span className={styles.status}><Globe size={10} />Externo</span>}
            </div>
          </div>
          <button type="button" className={styles.fechar} onClick={fechar} disabled={bloqueado} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        <div className={styles.conteudo}>
          <div className={styles.linha}>
            <span className={styles.icone}><MapPin size={14} /></span>
            <div><span className={styles.rotulo}>{modalidade}</span><strong>{item || 'Não informado'}</strong></div>
          </div>
          <div className={styles.linha}>
            <span className={styles.icone}><Clock size={14} /></span>
            <div>
              <span className={styles.rotulo}>Data e horário</span>
              <strong>{periodo || `${dataFormatada(reserva.data)} · ${reserva.horario_inicio.slice(0, 5)} às ${reserva.horario_fim.slice(0, 5)}`}</strong>
            </div>
          </div>
          {reserva.recorrencia && (
            <>
              <div className={styles.linha}>
                <span className={styles.icone}><Repeat size={14} /></span>
                <div><span className={styles.rotulo}>Recorrência</span><strong>{TIPO_RECORRENCIA_LABEL[reserva.recorrencia.tipo] || reserva.recorrencia.tipo}</strong></div>
              </div>
              <div className={styles.linha}>
                <span className={styles.icone}><CalendarCheck size={14} /></span>
                <div><span className={styles.rotulo}>Fim da recorrência</span><strong>{dataFormatada(reserva.recorrencia.data_fim)}</strong></div>
              </div>
            </>
          )}
          <div className={styles.linha}>
            <span className={styles.icone}><UserRound size={14} /></span>
            <div><span className={styles.rotulo}>Responsável</span><strong>{responsavel || 'Não informado'}</strong></div>
          </div>
          {detalhes.filter((detalhe) => detalhe.valor !== null && detalhe.valor !== undefined && detalhe.valor !== '').map((detalhe) => {
            const Icone = detalhe.icone || Info;
            return (
              <div className={styles.linha} key={detalhe.rotulo}>
                <span className={styles.icone}><Icone size={14} /></span>
                <div><span className={styles.rotulo}>{detalhe.rotulo}</span><strong>{detalhe.valor}</strong></div>
              </div>
            );
          })}

          {exigeTermo && (
            <TermoReserva key={reserva.id} reservaId={reserva.id} modalidade={reserva.modalidade}
              administrativo={administrativo} somenteResumo={administrativo}
              aoAtualizar={aoAtualizarTermo} aoProcessar={setEnviandoTermo} />
          )}

          {conteudoExtra}

          {erro && <p className={styles.erro} role="alert">{erro}</p>}
          {!erro && motivoAcoesIndisponiveis && (
            <p className={styles.erro}>{motivoAcoesIndisponiveis}</p>
          )}

          {administrativo && acoesAdministrativas}
          {!administrativo && (
            <div className={styles.acoes}>
              <button type="button" disabled={!aoEditar || bloqueado} onClick={aoEditar}>
                <Pencil size={13} /> Editar
              </button>
              <button type="button" className={styles.cancelar} disabled={!podeCancelar || bloqueado} onClick={() => setConfirmando(true)}>
                <Trash2 size={13} /> Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModalDetalheReserva;
