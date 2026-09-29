import { useEffect, useRef, useState } from 'react';
import { CalendarClock, Download, FileWarning, Info, Package, Pencil, Trash2, Upload, UserRound, X } from 'lucide-react';
import { STATUS_RESERVA_LABEL } from '../../utils/reserva';
import styles from './ModalDetalheReserva.module.css';
import ModalConfirmacao from '../Administracao/ModalConfirmacao/ModalConfirmacao';

function dataFormatada(data) {
  if (!data) return 'Não informada';
  return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR');
}

// Este modal não conhece APIs de recursos, veículos ou áreas.
// Cada página passa as informações e as funções que sua modalidade suporta.
function ModalDetalheReserva({
  reserva,
  modalidade,
  item,
  responsavel,
  detalhes = [],
  exigeTermo = false,
  urlTermo,
  aoEnviarTermo,
  aoEditar,
  aoCancelar,
  aoFechar,
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');
  const arquivoRef = useRef(null);

  useEffect(() => {
    function fecharComEscape(evento) {
      if (evento.key === 'Escape' && !processando) aoFechar();
    }
    document.addEventListener('keydown', fecharComEscape);
    return () => document.removeEventListener('keydown', fecharComEscape);
  }, [aoFechar, processando]);

  if (!reserva) return null;

  const tipo = String(reserva.tipo_reserva || '').toLowerCase();
  const status = String(reserva.status || '').toLowerCase();
  const podeCancelar = Boolean(aoCancelar);

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

  async function enviarTermo(evento) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo || !aoEnviarTermo) return;
    try {
      setProcessando(true);
      setErro('');
      await aoEnviarTermo(arquivo);
    } catch (falha) {
      setErro(falha.message || 'Não foi possível enviar o termo.');
    } finally {
      setProcessando(false);
      evento.target.value = '';
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
    <div className={styles.fundo} onMouseDown={processando ? undefined : aoFechar}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-detalhe-reserva"
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <header className={styles.cabecalho} data-tipo={tipo}>
          <div>
            <span className={styles.sobretitulo}>{modalidade}</span>
            <h2 id="titulo-detalhe-reserva">{reserva.nome}</h2>
            <span className={styles.status}>
              {STATUS_RESERVA_LABEL[status] || reserva.status}
            </span>
          </div>
          <button type="button" className={styles.fechar} onClick={aoFechar} disabled={processando} aria-label="Fechar">
            <X size={20} />
          </button>
        </header>

        <div className={styles.conteudo}>
          <div className={styles.linha}>
            <span className={styles.icone}><Package size={17} /></span>
            <div><span className={styles.rotulo}>{modalidade}</span><strong>{item || 'Não informado'}</strong></div>
          </div>
          <div className={styles.linha}>
            <span className={styles.icone}><CalendarClock size={17} /></span>
            <div>
              <span className={styles.rotulo}>Data e horário</span>
              <strong>{dataFormatada(reserva.data)} · {reserva.horario_inicio} às {reserva.horario_fim}</strong>
            </div>
          </div>
          <div className={styles.linha}>
            <span className={styles.icone}><UserRound size={17} /></span>
            <div><span className={styles.rotulo}>Responsável</span><strong>{responsavel || 'Não informado'}</strong></div>
          </div>
          {detalhes.filter((detalhe) => detalhe.valor !== null && detalhe.valor !== undefined && detalhe.valor !== '').map((detalhe) => {
            const Icone = detalhe.icone || Info;
            return (
              <div className={styles.linha} key={detalhe.rotulo}>
                <span className={styles.icone}><Icone size={17} /></span>
                <div><span className={styles.rotulo}>{detalhe.rotulo}</span><strong>{detalhe.valor}</strong></div>
              </div>
            );
          })}

          {exigeTermo && (
            <div className={styles.termos}>
              <div className={styles.alertaTermo}>
                <FileWarning size={18} />
                <div><strong>Termo de responsabilidade</strong><span>Este recurso exige termo assinado.</span></div>
              </div>
              <div className={styles.arquivosTermo}>
                <strong>Termo desta reserva</strong>
                {urlTermo ? (
                  <a href={urlTermo} download><Download size={15} /> Baixar termo em branco</a>
                ) : (
                  <span className={styles.indisponivel}>Download disponível após a integração da API de termos.</span>
                )}
                {aoEnviarTermo ? (
                  <>
                    <input ref={arquivoRef} type="file" accept=".pdf,.png,.jpg,.jpeg" hidden onChange={enviarTermo} />
                    <button type="button" className={styles.enviarTermo} disabled={processando} onClick={() => arquivoRef.current?.click()}>
                      <Upload size={15} /> Enviar termo assinado
                    </button>
                  </>
                ) : (
                  <span className={styles.indisponivel}>Envio disponível após a integração da API de termos.</span>
                )}
              </div>
            </div>
          )}

          {erro && <p className={styles.erro} role="alert">{erro}</p>}

          {confirmando ? (
            <div className={styles.acoes}>
              <button
                type="button"
                disabled={!aoEditar || processando}
                onClick={aoEditar}
              >
                <Pencil size={16} /> Editar
              </button>

              <button
                type="button"
                className={styles.cancelar}
                disabled={!podeCancelar || processando}
                onClick={() => setConfirmando(true)}
              >
                <Trash2 size={16} /> Cancelar
              </button>
            </div>
          ) : (
            <div className={styles.acoes}>
              <button type="button" disabled={!aoEditar || processando} title={!aoEditar ? 'Edição depende da API desta modalidade' : undefined} onClick={aoEditar}>
                <Pencil size={16} /> Editar
              </button>
              <button type="button" className={styles.cancelar} disabled={!podeCancelar || processando} title={!podeCancelar ? 'Cancelamento indisponível para esta reserva' : undefined} onClick={() => setConfirmando(true)}>
                <Trash2 size={16} /> Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModalDetalheReserva;