import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Download, FileText, FileWarning, LoaderCircle, Upload, XCircle } from 'lucide-react';
import { analisarTermo, analisarTermoOperacional, buscarTermo, buscarTermoOperacional, enviarTermo, enviarTermoOperacional } from '../../services/termos';
import styles from './TermoReserva.module.css';

const SITUACOES = { PENDENTE: 'Aguardando análise', APROVADO: 'Aprovado', REJEITADO: 'Rejeitado' };
const formatarData = (data) => new Date(data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

function HistoricoTermos({ termos }) {
  if (!termos.length) return null;

  return (
    <details className={styles.historico}>
      <summary>Histórico de envios ({termos.length})</summary>
      {termos.map((termo) => (
        <div className={styles.envioAnterior} key={termo.id}>
          <strong>{SITUACOES[termo.status]} · Substituído</strong>
          <a className={styles.link} href={termo.url_arquivo}><Download size={13} />{termo.nome_original}</a>
          <span>Enviado em {formatarData(termo.data_envio)}</span>
          {termo.motivo_rejeicao && <p className={styles.motivo}>Motivo: {termo.motivo_rejeicao}</p>}
          <a className={styles.link} href={termo.url_modelo}>Modelo deste envio</a>
        </div>
      ))}
    </details>
  );
}

export default function TermoReserva({
  reservaId, administrativo = false, somenteResumo = false,
  rejeitarInicialmente = false, aoAtualizar, aoProcessar,
  tipoDocumento = 'responsabilidade',
  ocultarIndisponivel = false,
}) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [rejeitando, setRejeitando] = useState(rejeitarInicialmente);
  const [motivo, setMotivo] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const arquivoRef = useRef(null);
  const motivoRef = useRef(null);

  useEffect(() => {
    let ativo = true;
    const buscar = tipoDocumento === 'responsabilidade'
      ? buscarTermo(reservaId)
      : buscarTermoOperacional(reservaId, tipoDocumento);
    buscar.then((resultado) => {
      if (ativo) setDados(resultado);
    }).catch((falha) => {
      if (ativo) setErro(falha.message);
    });
    return () => { ativo = false; };
  }, [reservaId, tentativa, tipoDocumento]);

  useEffect(() => {
    if (rejeitando && dados?.pode_analisar) motivoRef.current?.focus();
  }, [rejeitando, dados?.pode_analisar]);

  async function executar(operacao, mensagem) {
    setOcupado(true);
    aoProcessar?.(true);
    setErro('');
    setAviso('');
    try {
      const resultado = await operacao();
      setDados(resultado);
      setMotivo('');
      setRejeitando(false);
      setAviso(mensagem);
      aoAtualizar?.(resultado);
    } catch (falha) {
      setErro(falha.message);
      setTentativa((valor) => valor + 1);
    } finally {
      setOcupado(false);
      aoProcessar?.(false);
    }
  }

  function selecionarArquivo(evento) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!arquivo) return;
    setAviso('');
    if (!arquivo.name.toLowerCase().endsWith('.pdf') || !arquivo.size || arquivo.size > dados.limite_bytes) {
      setErro(`Envie um PDF não vazio de até ${dados.limite_bytes / 1024 / 1024} MB.`);
      return;
    }
    const enviar = tipoDocumento === 'responsabilidade'
      ? () => enviarTermo(reservaId, arquivo)
      : () => enviarTermoOperacional(reservaId, tipoDocumento, arquivo);
    executar(enviar, 'Termo enviado. Aguarde a análise de um administrador.');
  }

  function rejeitar(evento) {
    evento.preventDefault();
    if (!motivo.trim() || ocupado) return;
    const analisar = tipoDocumento === 'responsabilidade'
      ? () => analisarTermo(reservaId, dados.atual.id, 'REJEITADO', motivo.trim())
      : () => analisarTermoOperacional(reservaId, tipoDocumento, dados.atual.id, 'REJEITADO', motivo.trim());
    executar(analisar,
      'Termo rejeitado. O responsável poderá enviar um novo documento.');
  }

  let conteudo;
  if (!dados) {
    conteudo = <p className={styles.carregando} role="status"><LoaderCircle size={14} className={styles.girando} />Carregando termo…</p>;
    if (erro) {
      conteudo = <button className={styles.link} type="button" onClick={() => {
        setErro('');
        setTentativa((valor) => valor + 1);
      }}>Tentar novamente</button>;
    }
  } else {
    if (ocultarIndisponivel && tipoDocumento !== 'responsabilidade' && !dados.atual && !dados.pode_enviar) {
      return null;
    }
    const atual = dados.atual;
    let situacao = 'Aguardando envio do termo assinado.';
    let estado = 'NAO_ENVIADO';
    let IconeSituacao = FileWarning;
    if (atual) {
      estado = atual.status;
      situacao = 'Termo enviado. Aguardando análise do administrador.';
      if (atual.status === 'APROVADO') {
        situacao = 'Termo validado pelo administrador.';
        IconeSituacao = CheckCircle;
      } else if (atual.status === 'REJEITADO') {
        situacao = 'Termo rejeitado, reenvio necessário.';
        IconeSituacao = XCircle;
      }
    }

    let nomeModelo = 'Termo de responsabilidade — recursos.docx';
    let tituloDocumento = 'Termo deste recurso';
    if (tipoDocumento === 'retirada') {
      nomeModelo = 'Termo de retirada de veículo';
      tituloDocumento = 'Termo de retirada';
    }
    if (tipoDocumento === 'devolucao') {
      nomeModelo = 'Termo de devolução de veículo';
      tituloDocumento = 'Termo de devolução';
    }

    const resumo = (
      <div className={styles.alerta} data-status={estado}>
        <IconeSituacao size={14} />
        <div><strong>{tituloDocumento}</strong><p>{situacao}</p></div>
      </div>
    );

    let documento;
    if (atual) {
      let tituloEnvio = 'Arquivo assinado enviado';
      let IconeDocumento = CheckCircle;
      if (atual.status === 'APROVADO') tituloEnvio = 'Termo validado';
      if (atual.status === 'REJEITADO') {
        tituloEnvio = 'Termo rejeitado';
        IconeDocumento = XCircle;
      }
      documento = (
        <div className={styles.documento} data-administrativo={administrativo} data-status={atual.status}>
          {administrativo && <strong className={styles.tituloEnvio}><IconeDocumento size={12} />{tituloEnvio}</strong>}
          <a className={styles.link} href={atual.url_arquivo}><Download size={13} />{atual.nome_original}</a>
          <span>Enviado em {formatarData(atual.data_envio)} por {atual.enviado_por}</span>
          {atual.data_validacao && <span>Analisado em {formatarData(atual.data_validacao)} por {atual.validado_por}</span>}
          {atual.motivo_rejeicao && <p className={styles.motivo}><strong>Motivo da rejeição:</strong> {atual.motivo_rejeicao}</p>}
        </div>
      );
    } else if (administrativo) {
      documento = <div className={styles.semArquivo}><FileWarning size={14} /><p>Arquivo assinado ainda não enviado pelo usuário.</p></div>;
    }

    let textoEnvio = 'Enviar termo assinado';
    let IconeEnvio = Upload;
    if (atual) textoEnvio = 'Reenviar termo assinado';
    if (ocupado) {
      textoEnvio = 'Enviando termo…';
      IconeEnvio = LoaderCircle;
    }

    let acoesAnalise;
    if (administrativo && dados.pode_analisar) {
      acoesAnalise = (
        <div className={styles.acoes}>
          <button type="button" className={styles.rejeitar} disabled={ocupado} onClick={() => setRejeitando(true)}>
            <XCircle size={13} />Rejeitar termo
          </button>
          <button type="button" className={styles.aprovar} disabled={ocupado}
            onClick={() => executar(() => {
              if (tipoDocumento === 'responsabilidade') {
                return analisarTermo(reservaId, atual.id, 'APROVADO', '');
              }
              return analisarTermoOperacional(reservaId, tipoDocumento, atual.id, 'APROVADO', '');
            }, 'Termo aprovado pelo administrador.')}>
            <CheckCircle size={13} />Validar termo
          </button>
        </div>
      );
      if (rejeitando) {
        acoesAnalise = (
          <form className={styles.analise} onSubmit={rejeitar}>
            <label htmlFor={`motivo-termo-${reservaId}`}>Motivo da rejeição <span>(obrigatório)</span></label>
            <textarea ref={motivoRef} id={`motivo-termo-${reservaId}`} maxLength={1000} required
              value={motivo} disabled={ocupado} aria-describedby={`orientacao-termo-${reservaId}`}
              placeholder="Descreva o que precisa ser corrigido no documento."
              onChange={(evento) => setMotivo(evento.target.value)} />
            <small id={`orientacao-termo-${reservaId}`}>O responsável poderá consultar este motivo e reenviar o termo.</small>
            <div className={styles.acoes}>
              <button type="button" disabled={ocupado} onClick={() => setRejeitando(false)}>Voltar</button>
              <button type="submit" className={styles.rejeitar} disabled={ocupado || !motivo.trim()}><XCircle size={13} />Confirmar rejeição</button>
            </div>
          </form>
        );
      }
    }

    if (somenteResumo) {
      conteudo = resumo;
    } else if (administrativo) {
      conteudo = <>
        <div className={styles.modelo}>
          <span className={styles.iconeModelo}><FileText size={14} /></span>
          <div><span>Modelo original</span><strong>{nomeModelo}</strong></div>
        </div>
        {atual?.status !== 'APROVADO' && (
          <a className={styles.link} href={dados.url_modelo}><Download size={13} />Baixar modelo em branco</a>
        )}
        {documento}
        {acoesAnalise}
        <HistoricoTermos termos={dados.historico} />
      </>;
    } else {
      conteudo = <>
        {resumo}
        <div className={styles.arquivos}>
          <strong>{tituloDocumento}</strong>
          {dados.pode_enviar && (
            <a className={styles.link} href={dados.url_modelo}><Download size={13} />Baixar termo em branco</a>
          )} 
          {documento}
          {dados.pode_enviar && <>
            <p>Baixe o Word, preencha os dados e assine. Depois, envie o documento em PDF.</p>
            <input ref={arquivoRef} type="file" accept=".pdf,application/pdf" hidden onChange={selecionarArquivo} />
            <button className={`${styles.link} ${styles.enviar}`} type="button" disabled={ocupado} onClick={() => arquivoRef.current?.click()}>
              <IconeEnvio size={13} />{textoEnvio}
            </button>
            <small>PDF sem senha, até {dados.limite_bytes / 1024 / 1024} MB.</small>
          </>}
          {!dados.pode_enviar && !atual && <small>O envio está indisponível para a situação ou o período desta reserva.</small>}
        </div>
        <HistoricoTermos termos={dados.historico} />
      </>;
    }
  }

  return (
    <section className={styles.termo} aria-label={tipoDocumento === 'responsabilidade' ? 'Termo de responsabilidade' : `Termo de ${tipoDocumento}`} aria-busy={ocupado}>
      {conteudo}
      {ocupado && administrativo && <p role="status" className={styles.carregando}><LoaderCircle size={14} className={styles.girando} />Salvando análise…</p>}
      {erro && <p role="alert" className={styles.erro}>{erro}</p>}
      {aviso && <p role="status" className={styles.sucesso}><CheckCircle size={14} />{aviso}</p>}
    </section>
  );
}
