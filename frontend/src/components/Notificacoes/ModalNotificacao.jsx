import { useEffect } from "react";
import { Bell, CalendarClock, CheckCircle2, Clock3, X, UserRound, XCircle, FileText } from "lucide-react";
import { STATUS_RESERVA_LABEL } from "../../utils/reserva";
import styles from "./ModalNotificacao.module.css";

function formatarData(data) {
  if (!data) return "Não informada";
  return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");
}

function formatarHorario(horario) {
  if (!horario) return "--:--";
  return String(horario).slice(0, 5);
}

function formatarDataHora(dataHora) {
  if (!dataHora) return "Não informada";

  return new Date(dataHora).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function ModalNotificacao({ notificacao, aoFechar }) {
  useEffect(() => {
    function fecharComEsc(evento) {
      if (evento.key === "Escape") aoFechar();
    }

    document.addEventListener("keydown", fecharComEsc);
    return () => document.removeEventListener("keydown", fecharComEsc);
  }, [aoFechar]);

  if (!notificacao) return null;

  const reserva = notificacao.reserva;
  const status = String(reserva?.status || "").toLowerCase();
  const cancelamento = notificacao.tipo === "CANCELAMENTO_RESERVA";
  const termoRejeitado = notificacao.tipo === "TERMO_REJEITADO";
  const termoEnviado = notificacao.tipo === "TERMO_ENVIADO" || notificacao.tipo === "TERMO_REENVIADO";
  const IconeStatus = cancelamento || termoRejeitado
    ? XCircle
    : termoEnviado
    ? FileText
    : CheckCircle2;

  return (
    <div className={styles.fundo} onMouseDown={aoFechar}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-notificacao"
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <header className={styles.cabecalho}>
          <div className={styles.iconeTitulo}>
            <IconeStatus size={22} />
          </div>

          <div className={styles.tituloContainer}>
            <span>Notificação</span>
            <h2 id="titulo-notificacao">{notificacao.titulo}</h2>
          </div>

          <button
            type="button"
            className={styles.fechar}
            onClick={aoFechar}
            aria-label="Fechar notificação"
          >
            <X size={20} />
          </button>
        </header>

        <div className={styles.conteudo}>
          <p className={styles.mensagem}>{notificacao.mensagem}</p>
          {cancelamento && (
            <div className={styles.motivoCancelamento}>
              <span>Motivo do cancelamento</span>

              <strong>
                {reserva?.motivo_cancelamento || "Não informado"}
              </strong>
            </div>
          )}

          {reserva && (
            <div className={styles.detalhes}>
              <div className={styles.linha}>
                <span className={styles.icone}><Bell size={17} /></span>
                <div>
                  <span className={styles.rotulo}>Reserva</span>
                  <strong>{reserva.nome}</strong>
                </div>
              </div>

              <div className={styles.linha}>
                <span className={styles.icone}><CalendarClock size={17} /></span>
                <div>
                  <span className={styles.rotulo}>Data e horário</span>
                  <strong>
                    {formatarData(reserva.data)} · {formatarHorario(reserva.horario_inicio)} às {formatarHorario(reserva.horario_fim)}
                  </strong>
                </div>
              </div>

              <div className={styles.linha}>
                <span className={styles.icone}><CheckCircle2 size={17} /></span>
                <div>
                  <span className={styles.rotulo}>Status</span>
                  <strong>{STATUS_RESERVA_LABEL[status] || reserva.status}</strong>
                </div>
              </div>
              {cancelamento && reserva.cancelada_por && (
                <div className={styles.linha}>
                  <span className={styles.icone}>
                    <UserRound size={17} />
                  </span>

                  <div>
                    <span className={styles.rotulo}>Cancelada por</span>
                    <strong>{reserva.cancelada_por.nome}</strong>
                  </div>
                </div>
              )}

              {cancelamento && (
                <div className={styles.linha}>
                  <span className={styles.icone}>
                    <Clock3 size={17} />
                  </span>

                  <div>
                    <span className={styles.rotulo}>Cancelada em</span>
                    <strong>{formatarDataHora(reserva.cancelada_em)}</strong>
                  </div>
                </div>
              )}

            </div>
          )}



          <div className={styles.criadaEm}>
            <Clock3 size={15} />
            <span>Recebida em {formatarDataHora(notificacao.criada_em)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalNotificacao;
