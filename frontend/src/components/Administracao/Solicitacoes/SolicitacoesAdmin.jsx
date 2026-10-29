import { useEffect, useState } from 'react';
import { CheckCircle, Eye, FileText, FileWarning, Info, LoaderCircle, MapPin, Package, UserRound, XCircle } from 'lucide-react';
import { listarSolicitacoes } from '../../../services/termos';
import { confirmarReservaPendente } from '../../../services';
import { SITUACAO_RESERVA_LABEL, statusReservaApresentado } from '../../../utils/reserva';
import Select from '../../Select/Select';
import ModalDetalheReserva from '../../ModalDetalheReserva/ModalDetalheReserva';
import ModalTermo from '../../TermoReserva/ModalTermo';
import Paginacao from '../Paginacao/Paginacao';
import styles from './SolicitacoesAdmin.module.css';

const TIPOS = [{ valor: 'veiculo', rotulo: 'Veículos' }, { valor: 'recurso_geral', rotulo: 'Recursos' }];
const DOCUMENTOS = [
  { valor: 'responsabilidade', rotulo: 'Responsabilidade' },
  { valor: 'retirada', rotulo: 'Retirada de veículo' },
  { valor: 'devolucao', rotulo: 'Devolução de veículo' },
];
const SITUACOES_SOLICITACAO = [
  'aguardando_confirmacao',
  'aguardando_envio_termo',
  'termo_em_analise',
  'aguardando_envio_termo_retirada',
  'aguardando_termo_devolucao',
];
const SITUACOES = SITUACOES_SOLICITACAO.map((valor) => ({
  valor,
  rotulo: SITUACAO_RESERVA_LABEL[valor],
}));
const TAMANHO_PAGINA = 20;
const data = (valor) => new Date(`${valor}T12:00:00`).toLocaleDateString('pt-BR');

function datas(reserva) {
  if (reserva.data_devolucao_prevista !== reserva.data) {
    return `${data(reserva.data)} – ${data(reserva.data_devolucao_prevista)}`;
  }
  return data(reserva.data);
}

function periodo(reserva) {
  if (reserva.data_devolucao_prevista !== reserva.data) {
    return `${data(reserva.data)} às ${reserva.horario_inicio.slice(0, 5)} até ${data(reserva.data_devolucao_prevista)} às ${reserva.horario_fim.slice(0, 5)}`;
  }
  return `${data(reserva.data)} · ${reserva.horario_inicio.slice(0, 5)} às ${reserva.horario_fim.slice(0, 5)}`;
}

function modalidade(reserva) {
  if (reserva.modalidade === 'veiculo') return 'Veículo';
  return 'Recurso';
}

function AcoesSolicitacao({ reserva, aoVerTermo, aoVerDetalhes, aoConfirmar, confirmando }) {
  const confirmacao = reserva.situacao === 'AGUARDANDO_CONFIRMACAO';
  const aberta = reserva.situacao === 'TERMO_EM_ANALISE';
  return (
    <div className={styles.acoes}>
      {aoVerDetalhes && <button type="button" onClick={aoVerDetalhes}><Eye size={13} />Detalhes</button>}
      {confirmacao ? (
        <button type="button" className={styles.aprovar} disabled={confirmando}
          onClick={() => aoConfirmar(reserva)}><CheckCircle size={13} />{confirmando ? 'Confirmando…' : 'Confirmar reserva'}</button>
      ) : <>
        <button type="button" className={styles.verTermo} onClick={() => aoVerTermo(false)}><FileText size={13} />Ver termo</button>
      {aberta && <>
        <button type="button" className={styles.recusar} onClick={() => aoVerTermo(true)}><XCircle size={13} />Recusar</button>
        <button type="button" className={styles.aprovar} onClick={() => aoVerTermo(false)}><CheckCircle size={13} />Validar termo</button>
      </>}
      </>}
    </div>
  );
}

export default function SolicitacoesAdmin() {
  const [tipo, setTipo] = useState('todos');
  const [documento, setDocumento] = useState('todos');
  const [situacao, setSituacao] = useState('todos');
  const [pagina, setPagina] = useState(1);
  const [lista, setLista] = useState({ results: [], count: 0 });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [revisao, setRevisao] = useState(0);
  const [selecionada, setSelecionada] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);

  useEffect(() => {
    const controle = new AbortController();
    listarSolicitacoes({ tipo, documento, situacao, page: pagina, page_size: TAMANHO_PAGINA }, controle.signal)
      .then((resultado) => {
        if (!controle.signal.aborted) setLista(resultado);
      })
      .catch((falha) => {
        if (!controle.signal.aborted) setErro(falha.message);
      })
      .finally(() => {
        if (!controle.signal.aborted) setCarregando(false);
      });
    return () => controle.abort();
  }, [tipo, documento, situacao, pagina, revisao]);

  async function confirmar(reserva) {
    try {
      setConfirmandoId(reserva.id);
      setErro('');
      await confirmarReservaPendente(reserva.id);
      setSelecionada(null);
      recarregar();
    } catch (falha) {
      setErro(falha.message || 'Não foi possível confirmar a reserva.');
    } finally {
      setConfirmandoId(null);
    }
  }

  function recarregar() {
    setErro('');
    setCarregando(true);
    setRevisao((valor) => valor + 1);
  }

  function filtrar(alterar, valor) {
    setErro('');
    setCarregando(true);
    setPagina(1);
    alterar(valor);
  }

  function mudarPagina(valor) {
    setCarregando(true);
    setErro('');
    setPagina(valor);
  }

  function abrirTermo(reserva, rejeitar = false) {
    setSelecionada({ ...reserva, mostrarTermo: true, rejeitar });
  }

  function atualizarSelecionada(dados) {
    setSelecionada((atual) => {
      if (atual?.id === dados.reserva) return { ...atual, status: dados.status_reserva };
      return atual;
    });
    setPagina(1);
    recarregar();
  }

  let conteudoLista;
  if (carregando) {
    conteudoLista = <div className={styles.estado} role="status"><LoaderCircle size={28} className={styles.girando} /><p>Carregando solicitações…</p></div>;
  } else if (erro) {
    conteudoLista = <div className={styles.estado} role="alert">
      <FileWarning size={28} /><p>{erro}</p><button type="button" onClick={recarregar}>Tentar novamente</button>
    </div>;
  } else if (!lista.results.length) {
    conteudoLista = <div className={styles.estado}><CheckCircle size={32} /><p>Nenhuma solicitação encontrada.</p></div>;
  } else {
    conteudoLista = <>
      <div className={styles.lista}>
        {lista.results.map((reserva) => {
          const statusApresentado = statusReservaApresentado(reserva).toUpperCase();
          const rotuloSituacao = SITUACAO_RESERVA_LABEL[statusApresentado.toLowerCase()] || reserva.status;
          return (
            <article className={styles.cartao} data-status={statusApresentado} key={reserva.id} aria-label={reserva.nome}>
              <div className={styles.informacoes}>
                <header className={styles.titulo}>
                  <h3>{reserva.nome}</h3>
                  <span className={styles.etiqueta}>{modalidade(reserva)}</span>
                  {reserva.tipo_reserva === 'EXTERNA' && <span className={styles.externo}>Externo</span>}
                  <span className={styles.situacao} data-status={statusApresentado}>
                    {['AGUARDANDO_ENVIO_TERMO', 'AGUARDANDO_ENVIO_TERMO_RETIRADA', 'TERMO_EM_ANALISE', 'AGUARDANDO_TERMO_DEVOLUCAO'].includes(statusApresentado) && <FileWarning size={10} />}{rotuloSituacao}
                  </span>
                </header>
                <p className={styles.descricao}>{reserva.finalidade || reserva.descricao || reserva.item}</p>
                <div className={styles.metadados}>
                  <span>{datas(reserva)}</span>
                  <span>{reserva.horario_inicio.slice(0, 5)}–{reserva.horario_fim.slice(0, 5)}</span>
                  <span>{reserva.responsavel}</span>
                </div>
              </div>
              <AcoesSolicitacao reserva={reserva}
                aoVerDetalhes={() => setSelecionada({ ...reserva, mostrarTermo: false })}
                aoVerTermo={(rejeitar) => abrirTermo(reserva, rejeitar)}
                aoConfirmar={confirmar} confirmando={confirmandoId === reserva.id} />
            </article>
          );
        })}
      </div>
      <Paginacao paginaAtual={pagina} totalPaginas={Math.ceil(lista.count / TAMANHO_PAGINA)} aoMudarPagina={mudarPagina} />
    </>;
  }

  let modal;
  if (selecionada) {
    if (selecionada.mostrarTermo) {
      modal = <ModalTermo key={`${selecionada.id}-${selecionada.termo_tipo}`} reserva={selecionada} tipoDocumento={selecionada.termo_tipo}
        rejeitar={selecionada.rejeitar}
        aoFechar={() => setSelecionada(null)} aoAtualizar={atualizarSelecionada} />;
    } else {
      modal = <ModalDetalheReserva reserva={selecionada} modalidade={modalidade(selecionada)}
        item={selecionada.item} responsavel={selecionada.responsavel} periodo={periodo(selecionada)}
        administrativo exigeTermo={selecionada.modalidade !== 'veiculo'} aoFechar={() => setSelecionada(null)}
        detalhes={[
          { rotulo: 'Finalidade', valor: selecionada.finalidade || selecionada.descricao, icone: Info },
          { rotulo: 'Destino', valor: selecionada.destino, icone: MapPin },
          { rotulo: 'Ocupantes', valor: selecionada.ocupantes, icone: UserRound },
          { rotulo: 'Quantidade', valor: selecionada.quantidade, icone: Package },
        ]}
        acoesAdministrativas={<div className={styles.acoesDetalhes}>
          <AcoesSolicitacao reserva={selecionada} aoVerTermo={(rejeitar) => abrirTermo(selecionada, rejeitar)}
            aoConfirmar={confirmar} confirmando={confirmandoId === selecionada.id} />
        </div>} />;
    }
  }

  return (
    <section className={styles.pagina} aria-label="Solicitações de termos de responsabilidade">
      <div className={styles.filtros}>
        <Select valor={documento} aoAlterar={(valor) => filtrar(setDocumento, valor)} opcoes={DOCUMENTOS}
          valorTodos="todos" rotuloTodos="Todos os termos" ariaLabel="Tipo de documento" />
        <Select valor={tipo} aoAlterar={(valor) => filtrar(setTipo, valor)} opcoes={TIPOS}
          valorTodos="todos" rotuloTodos="Todos os tipos" ariaLabel="Tipo de solicitação" />
        <Select valor={situacao} aoAlterar={(valor) => filtrar(setSituacao, valor)} opcoes={SITUACOES}
          valorTodos="todos" rotuloTodos="Todas as situações" ariaLabel="Situação da reserva" />
      </div>
      {conteudoLista}
      {modal}
    </section>
  );
}
