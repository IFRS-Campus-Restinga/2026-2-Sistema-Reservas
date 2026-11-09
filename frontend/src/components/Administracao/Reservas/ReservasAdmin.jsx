import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Repeat, Trash2 } from 'lucide-react';
import Paginacao from '../Paginacao/Paginacao';
import styles from './ReservasAdmin.module.css';
import RelatorioUso from '../RelatorioUso/RelatorioUso';

import {
  buscarAreas,
  buscarBlocos,
  cancelarReservaAdmin,
  listarReservasAdmin,
} from '../../../services';
import { consultarTodasPaginas } from '../../../services/paginacao';

import CampoBusca from '../CampoBusca/CampoBusca';
import TabelaAdministracao from '../TabelaAdmin/TabelaAdmin';
import ModalConfirmacao from '../ModalConfirmacao/ModalConfirmacao';
import Select from '../../Select/Select';

import ModalDetalheReserva from '../../ModalDetalheReserva/ModalDetalheReserva';

import ReservaAreaModal from '../../ReservaArea/ReservaAreaModal';

import ReservaRecursoGeralModal from '../../ReservaRecursoGeral/ReservaRecursoGeralModal';

import ReservaVeiculoModal from '../../ReservaVeiculo/ReservaVeiculoModal';

import GerenciarRecorrenciaModal from '../../RecorrenciaArea/GerenciarRecorrenciaModal';

import GerenciarRecorrenciaVeiculoModal from '../../RecorrenciaVeiculo/GerenciarRecorrenciaVeiculoModal';

import GerenciarRecorrenciaRecursoGeralModal from '../../RecorrenciaRecursoGeral/GerenciarRecorrenciaRecursoGeralModal';

import { STATUS_RESERVA_LABEL } from '../../../utils/reserva';
import { TIPO_RECORRENCIA_LABEL } from '../../../utils/recorrencia';

const MODALIDADE_LABEL = {
  area: 'Área',
  veiculo: 'Veículo',
  recurso_geral: 'Recurso geral',
};

const TAMANHO_PAGINA = 20;

const STATUS_GERENCIAVEIS = new Set([
  'PENDENTE',
  'CONFIRMADA',
  'AGUARDANDO_TERMO',
  'AGUARDANDO_TERMO_DEVOLUCAO',
]);

function formatarData(data) {
  if (!data) return '—';

  return new Date(
    `${data}T12:00:00`
  ).toLocaleDateString('pt-BR');
}


function formatarHorario(horario) {
  return horario
    ? horario.slice(0, 5)
    : '—';
}


function labelStatus(status) {
  return (
    STATUS_RESERVA_LABEL[
      String(status || '').toLowerCase()
    ] || status
  );
}


function descricaoItem(reserva) {
  const item = reserva.item || {};

  if (reserva.modalidade === 'area') {
    return item.nome || 'Área não informada';
  }

  if (reserva.modalidade === 'veiculo') {
    return item.nome || 'Veículo não informado';
  }

  return item.nome || 'Recurso não informado';
}


function detalheSecundario(reserva) {
  const item = reserva.item || {};

  if (reserva.modalidade === 'area') {
    return item.bloco
      ? `Bloco ${item.bloco}`
      : '—';
  }

  if (reserva.modalidade === 'veiculo') {
    return item.placa || '—';
  }

  return item.tipo || '—';
}


// Série recorrente agrupada pelo backend (agrupar_recorrencias)
function ehSerie(reserva) {
  return Boolean(
    reserva?.recorrencia &&
    !reserva.ehOcorrenciaIndividual &&
    reserva.ocorrencias?.length
  );
}


function podeGerenciarRecorrencia(reserva) {
  return Boolean(
    reserva?.recorrencia &&
    ['area', 'veiculo', 'recurso_geral'].includes(reserva.modalidade) &&
    !reserva.detalhes?.celula_timetable
  );
}


// Reservas de veículo podem terminar em outro dia
function horarioOcorrencia(reserva) {
  const inicio = formatarHorario(reserva.horario_inicio);
  const fim = formatarHorario(reserva.horario_fim);
  const devolucao = reserva.detalhes?.data_devolucao_prevista;

  return reserva.modalidade === 'veiculo' && devolucao && devolucao !== reserva.data
    ? `${inicio} até ${formatarData(devolucao)} ${fim}`
    : `${inicio}–${fim}`;
}


function motivoBloqueioGerenciamento(reserva) {
  return reserva.detalhes?.celula_timetable
    ? 'Reservas do Timetable são gerenciadas pela sincronização.'
    : 'Esta reserva não pode mais ser alterada.';
}


function periodoDetalhe(reserva) {
  const horario = `${formatarHorario(reserva.horario_inicio)} às ${formatarHorario(reserva.horario_fim)}`;

  return ehSerie(reserva)
    ? `${formatarData(reserva.primeira_data)} até ${formatarData(reserva.ultima_data)} · ${horario}`
    : `${formatarData(reserva.data)} · ${horario}`;
}


function dadosParaEdicao(reserva) {
  const detalhes = reserva.detalhes || {};
  const item = reserva.item || {};

  const base = {
    id: reserva.id,
    nome: reserva.nome,
    descricao: reserva.descricao,
    status: reserva.status,
    data: reserva.data,
    horario_inicio: reserva.horario_inicio,
    horario_fim: reserva.horario_fim,
    tipo_reserva: reserva.tipo_reserva,
  };

  if (reserva.modalidade === 'area') {
    return {
      ...base,
      area: item.id,
      aula: detalhes.aula,
    };
  }

  if (reserva.modalidade === 'veiculo') {
    return {
      ...base,
      veiculo: item.id,
      destino: detalhes.destino,
      finalidade: detalhes.finalidade,
      quantidade_passageiros:
        detalhes.quantidade_passageiros,
      data_devolucao_prevista:
        detalhes.data_devolucao_prevista,
    };
  }

  return {
    ...base,
    recurso_geral: item.id,
    quantidades: detalhes.quantidades,
    data_devolucao_prevista:
      detalhes.data_devolucao_prevista,
  };
}


function ReservasAdmin() {
  const [reservas, setReservas] = useState([]);

  const [areas, setAreas] = useState([]);
  const [blocos, setBlocos] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [tiposRecurso, setTiposRecurso] = useState([]);

  const [busca, setBusca] = useState('');
  const [modalidade, setModalidade] = useState('todas');

  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalReservas, setTotalReservas] = useState(0);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [mensagemSucesso, setMensagemSucesso] =
    useState('');

  const [reservaDetalhes, setReservaDetalhes] =
    useState(null);

  const [reservaEditando, setReservaEditando] =
    useState(null);

  const [reservaCancelando, setReservaCancelando] =
    useState(null);

  const [motivoCancelamento, setMotivoCancelamento] =
    useState('');

  const [erroCancelamento, setErroCancelamento] =
    useState('');

  const [cancelando, setCancelando] = useState(false);

  const [seriesExpandidas, setSeriesExpandidas] =
    useState({});

  const [recorrenciaGerenciada, setRecorrenciaGerenciada] =
    useState(null);

  useEffect(() => {
    let ativo = true;
    Promise.all([
      buscarAreas(),
      buscarBlocos(),
      consultarTodasPaginas('/api/veiculos/'),
      consultarTodasPaginas('/api/recursos-gerais/'),
      consultarTodasPaginas('/api/tipos-recurso/'),
    ])
      .then(([areas, blocos, veiculos, recursos, tipos]) => {
        if (!ativo) return;
        setAreas(areas || []); setBlocos(blocos || []); setVeiculos(veiculos || []);
        setRecursos(recursos || []); setTiposRecurso(tipos || []);
      }).catch((falha) => { if (ativo) setErro(falha.message); });
    return () => { ativo = false; };
  }, []);

  const carregarReservas = useCallback(async (signal) => {
    try {
      setCarregando(true);
      setErro('');

      const tipo =
        modalidade === 'todas'
          ? 'todos'
          : modalidade;

      const resultado =
        await listarReservasAdmin(
          {
            busca: busca.trim(),
            tipo,
            page: pagina,
            page_size: TAMANHO_PAGINA,
            agrupar_recorrencias: true,
          },
          signal
        );

      if (signal?.aborted) {
        return;
      }

      setReservas(resultado.results || []);
      setTotal(resultado.count || 0);
      setTotalReservas(resultado.total_reservas ?? resultado.count ?? 0);
    } catch (falha) {
      if (falha.name === 'AbortError') {
        return;
      }

      console.error(falha);

      setErro(
        falha.message ||
          'Não foi possível carregar as reservas.'
      );
    } finally {
      if (!signal?.aborted) {
        setCarregando(false);
      }
    }
  }, [busca, modalidade, pagina]);

  useEffect(() => {
    const controle = new AbortController();

    const atraso = setTimeout(() => {
      carregarReservas(controle.signal);
    }, 300);

    return () => {
      clearTimeout(atraso);
      controle.abort();
    };
  }, [carregarReservas]);

  function podeGerenciar(reserva) {
    if (!STATUS_GERENCIAVEIS.has(reserva.status)) {
      return false;
    }

    if (
      reserva.modalidade === 'area' &&
      reserva.detalhes?.celula_timetable
    ) {
      return false;
    }

    return true;
  }


  function abrirEdicao(reserva) {
    setMensagemSucesso('');
    setReservaEditando(reserva);
  }


  function fecharEdicao() {
    setReservaEditando(null);
  }


  async function reservaAtualizada() {
    const nome = reservaEditando?.nome;

    setReservaEditando(null);

    await carregarReservas();

    setMensagemSucesso(
      nome
        ? `Reserva "${nome}" atualizada com sucesso.`
        : 'Reserva atualizada com sucesso.'
    );
  }


  function alternarSerie(idRecorrencia) {
    setSeriesExpandidas((atuais) => ({
      ...atuais,
      [idRecorrencia]: !atuais[idRecorrencia],
    }));
  }


  function abrirRecorrencia(reserva) {
    setMensagemSucesso('');
    setReservaDetalhes(null);
    setRecorrenciaGerenciada({
      id: reserva.recorrencia.id,
      modalidade: reserva.modalidade,
    });
  }


  async function recorrenciaAlterada(mensagem) {
    setRecorrenciaGerenciada(null);

    await carregarReservas();

    setMensagemSucesso(mensagem);
  }


  function renderizarOcorrencias(reserva) {
    if (!ehSerie(reserva) || !seriesExpandidas[reserva.recorrencia.id]) {
      return null;
    }

    return (
      <ul className={styles.ocorrencias}>
        {reserva.ocorrencias.map((ocorrencia) => (
          <li key={ocorrencia.id}>
            <button
              type="button"
              className={styles.ocorrencia}
              onClick={() =>
                setReservaDetalhes({
                  ...ocorrencia,
                  ehOcorrenciaIndividual: true,
                })
              }
            >
              <strong>{formatarData(ocorrencia.data)}</strong>

              <span>{horarioOcorrencia(ocorrencia)}</span>

              <span
                className={styles.status}
                data-status={ocorrencia.status}
              >
                {labelStatus(ocorrencia.status)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    );
  }


  function solicitarCancelamento(reserva) {
    setMensagemSucesso('');
    setErroCancelamento('');
    setMotivoCancelamento('');
    setReservaCancelando(reserva);
  }


  function abrirEdicaoDetalhes(reserva) {
    setReservaDetalhes(null);
    abrirEdicao(reserva);
  }


  function solicitarCancelamentoDetalhes(reserva) {
    setReservaDetalhes(null);
    solicitarCancelamento(reserva);
  }


  function fecharCancelamento() {
    if (cancelando) return;

    setReservaCancelando(null);
    setMotivoCancelamento('');
    setErroCancelamento('');
  }


  async function confirmarCancelamento() {
    if (!reservaCancelando || cancelando) {
      return;
    }

    const motivo = motivoCancelamento.trim();

    if (!motivo) {
      setErroCancelamento(
        'Informe o motivo do cancelamento.'
      );

      return;
    }

    try {
      setCancelando(true);
      setErroCancelamento('');

      await cancelarReservaAdmin(
        reservaCancelando.id,
        motivo
      );

      const nome = reservaCancelando.nome;

      setReservaCancelando(null);
      setMotivoCancelamento('');

      await carregarReservas();

      setMensagemSucesso(
        `Reserva "${nome}" cancelada com sucesso.`
      );
    } catch (falha) {
      console.error(falha);

      setErroCancelamento(
        falha.message ||
        'Não foi possível cancelar a reserva.'
      );
    } finally {
      setCancelando(false);
    }
  }

  const colunas = [
    {
      chave: 'nome',
      titulo: 'Reserva',
      renderizar: (reserva) => {
        if (!ehSerie(reserva)) {
          return (
            <button
              type="button"
              className={styles.nomeReserva}
              onClick={() =>
                setReservaDetalhes(reserva)
              }
            >
              {reserva.nome}
            </button>
          );
        }

        const expandida = Boolean(
          seriesExpandidas[reserva.recorrencia.id]
        );

        return (
          <div className={styles.serie}>
            <button
              type="button"
              className={styles.expandir}
              aria-expanded={expandida}
              aria-label={`${expandida ? 'Recolher' : 'Expandir'} reservas da série ${reserva.nome}`}
              onClick={() =>
                alternarSerie(reserva.recorrencia.id)
              }
            >
              {expandida
                ? <ChevronDown size={14} />
                : <ChevronRight size={14} />}
            </button>

            <div className={styles.dadoSerie}>
              <button
                type="button"
                className={styles.nomeReserva}
                onClick={() =>
                  setReservaDetalhes(reserva)
                }
              >
                {reserva.nome}
              </button>

              <small>
                <Repeat size={11} />
                {TIPO_RECORRENCIA_LABEL[reserva.recorrencia.tipo] ||
                  reserva.recorrencia.tipo}
                {' · '}
                {formatarData(reserva.primeira_data)} até{' '}
                {formatarData(reserva.ultima_data)}
                {' · '}
                {reserva.total_ocorrencias} reservas
              </small>
            </div>
          </div>
        );
      },
    },
    {
      chave: 'modalidade',
      titulo: 'Tipo',
      renderizar: (reserva) => (
        <span
          className={styles.modalidade}
          data-modalidade={reserva.modalidade}
        >
          {MODALIDADE_LABEL[reserva.modalidade] ||
            'Reserva'}
        </span>
      ),
    },
    {
      chave: 'item',
      titulo: 'Item reservado',
      renderizar: (reserva) => (
        <div className={styles.dadoPrincipal}>
          <span>
            {descricaoItem(reserva)}
          </span>

          <small>
            {detalheSecundario(reserva)}
          </small>
        </div>
      ),
    },
    {
      chave: 'status',
      titulo: 'Status',
      renderizar: (reserva) => (
        <span
          className={styles.status}
          data-status={reserva.status}
        >
          {labelStatus(reserva.status)}
        </span>
      ),
    },
    {
      chave: 'usuario',
      titulo: 'Usuário',
      renderizar: (reserva) => (
        <div className={styles.dadoPrincipal}>
          <span>
            {reserva.usuario?.nome ||
              'Não informado'}
          </span>

          <small>
            {reserva.usuario?.email || '—'}
          </small>
        </div>
      ),
    },
    {
      chave: 'acoes',
      titulo: 'Ações',
      renderizar: (reserva) => {
        if (ehSerie(reserva)) {
          return null;
        }

        const gerenciavel =
          podeGerenciar(reserva);

        const motivoBloqueio =
          motivoBloqueioGerenciamento(reserva);

        return (
          <div className={styles.acoes}>
            <button
              type="button"
              className={styles.editar}
              disabled={!gerenciavel}
              onClick={() => abrirEdicao(reserva)}
              title={
                gerenciavel
                  ? 'Editar reserva'
                  : motivoBloqueio
              }
              aria-label={`Editar reserva ${reserva.nome}`}
            >
              <Pencil size={14} />
            </button>

            <button
              type="button"
              className={styles.cancelar}
              disabled={!gerenciavel}
              onClick={() =>
                solicitarCancelamento(reserva)
              }
              title={
                gerenciavel
                  ? 'Cancelar reserva'
                  : motivoBloqueio
              }
              aria-label={`Cancelar reserva ${reserva.nome}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      },
    },
  ];


  const reservaEdicao = reservaEditando
    ? dadosParaEdicao(reservaEditando)
    : null;


  const areaInicial =
    reservaEditando?.modalidade === 'area'
      ? areas.find(
          (area) =>
            String(area.id) ===
            String(reservaEditando.item?.id)
        )
      : null;


  const veiculoInicial =
    reservaEditando?.modalidade === 'veiculo'
      ? veiculos.find(
          (veiculo) =>
            String(veiculo.id) ===
            String(reservaEditando.item?.id)
        )
      : null;


  const recursoInicial =
    reservaEditando?.modalidade ===
    'recurso_geral'
      ? recursos.find(
          (recurso) =>
            String(recurso.id) ===
            String(reservaEditando.item?.id)
        )
      : null;


  return (
    <div className={styles.reservas}>
      <div className={styles.cabecalhoSecao}>
        <div className={styles.filtros}>
          <CampoBusca
            valor={busca}
            aoAlterar={(valor) => {
              setBusca(valor);
              setPagina(1);
            }}
            placeholder="Buscar reserva..."
          />

          <Select
            valor={modalidade}
            aoAlterar={(valor) => {
              setModalidade(valor);
              setPagina(1);
            }}
            valorTodos="todas"
            rotuloTodos="Todos os tipos"
            ariaLabel="Filtrar reservas por tipo"
            opcoes={[
              {
                valor: 'area',
                rotulo: 'Áreas',
              },
              {
                valor: 'veiculo',
                rotulo: 'Veículos',
              },
              {
                valor: 'recurso_geral',
                rotulo: 'Recursos gerais',
              },
            ]}
          />
        </div>
        <div className={styles.acoesRelatorio}>
          {!carregando && !erro && (
            <span className={styles.contador} role="status">
              {totalReservas} {totalReservas === 1 ? 'reserva' : 'reservas'}
            </span>
          )}
          <RelatorioUso />
        </div>
      </div>


      {mensagemSucesso && (
        <p
          className={styles.sucesso}
          role="status"
        >
          {mensagemSucesso}
        </p>
      )}


      {erro && (
        <p
          className={styles.erro}
          role="alert"
        >
          {erro}
        </p>
      )}


      {carregando ? (
        <p
          className={styles.carregando}
          role="status"
        >
          Carregando reservas...
        </p>
      ) : (
        <>
          <TabelaAdministracao
            colunas={colunas}
            dados={reservas}
            renderizarExpansao={renderizarOcorrencias}
            mensagemVazia={
              busca.trim() ||
              modalidade !== 'todas'
                ? 'Nenhuma reserva encontrada para os filtros selecionados.'
                : 'Nenhuma reserva cadastrada.'
            }
          />

          <Paginacao
            paginaAtual={pagina}
            totalPaginas={Math.ceil(
              total / TAMANHO_PAGINA
            )}
            aoMudarPagina={setPagina}
          />
        </>
      )}


      <ModalDetalheReserva
        reserva={reservaDetalhes}
        modalidade={
          MODALIDADE_LABEL[
            reservaDetalhes?.modalidade
          ] || 'Reserva'
        }
        item={
          reservaDetalhes
            ? descricaoItem(reservaDetalhes)
            : ''
        }
        responsavel={
          reservaDetalhes?.usuario
            ? `${reservaDetalhes.usuario.nome} · ${reservaDetalhes.usuario.email}`
            : ''
        }
        periodo={
          reservaDetalhes
            ? periodoDetalhe(reservaDetalhes)
            : ''
        }
        detalhes={
          reservaDetalhes
            ? [
                {
                  rotulo: 'Total de repetições',
                  valor: ehSerie(reservaDetalhes)
                    ? `${reservaDetalhes.total_ocorrencias} datas agendadas`
                    : null,
                },
                {
                  rotulo: 'Descrição',
                  valor:
                    reservaDetalhes.descricao,
                },
                {
                  rotulo: 'Detalhe do item',
                  valor:
                    detalheSecundario(
                      reservaDetalhes
                    ),
                },
                {
                  rotulo: 'Quantidade',
                  valor:
                    reservaDetalhes.detalhes
                      ?.quantidades,
                },
                {
                  rotulo: 'Destino',
                  valor:
                    reservaDetalhes.detalhes
                      ?.destino,
                },
                {
                  rotulo: 'Finalidade',
                  valor:
                    reservaDetalhes.detalhes
                      ?.finalidade,
                },
                {
                  rotulo: 'Passageiros',
                  valor:
                    reservaDetalhes.detalhes
                      ?.quantidade_passageiros,
                },
                {
                  rotulo: 'Devolução prevista',
                  valor:
                    reservaDetalhes.detalhes
                      ?.data_devolucao_prevista
                      ? formatarData(
                          reservaDetalhes.detalhes
                            .data_devolucao_prevista
                        )
                      : null,
                },
              ]
            : []
        }
        administrativo
        motivoAcoesIndisponiveis={
          reservaDetalhes &&
          !ehSerie(reservaDetalhes) &&
          !podeGerenciar(reservaDetalhes)
            ? motivoBloqueioGerenciamento(reservaDetalhes)
            : undefined
        }
        acoesAdministrativas={
          reservaDetalhes ? (
            <div className={styles.acoesDetalhe}>
              {!ehSerie(reservaDetalhes) && (
                <>
                  <button
                    type="button"
                    disabled={!podeGerenciar(reservaDetalhes)}
                    onClick={() =>
                      abrirEdicaoDetalhes(reservaDetalhes)
                    }
                  >
                    <Pencil size={13} /> Editar
                  </button>

                  <button
                    type="button"
                    className={styles.cancelarDetalhe}
                    disabled={!podeGerenciar(reservaDetalhes)}
                    onClick={() =>
                      solicitarCancelamentoDetalhes(reservaDetalhes)
                    }
                  >
                    <Trash2 size={13} /> Cancelar
                  </button>
                </>
              )}

              {podeGerenciarRecorrencia(reservaDetalhes) && (
                <button
                  type="button"
                  className={styles.larguraTotal}
                  onClick={() =>
                    abrirRecorrencia(reservaDetalhes)
                  }
                >
                  <Repeat size={13} /> Gerenciar recorrência
                </button>
              )}
            </div>
          ) : null
        }
        aoFechar={() =>
          setReservaDetalhes(null)
        }
      />


      {recorrenciaGerenciada?.modalidade === 'area' && (
        <GerenciarRecorrenciaModal
          aberto
          recorrenciaId={recorrenciaGerenciada.id}
          areas={areas}
          blocos={blocos}
          aoFechar={() => setRecorrenciaGerenciada(null)}
          aoSalvar={() => recorrenciaAlterada('Recorrência atualizada com sucesso.')}
          aoCancelarRecorrencia={() => recorrenciaAlterada('Recorrência cancelada com sucesso.')}
        />
      )}


      {recorrenciaGerenciada?.modalidade === 'veiculo' && (
        <GerenciarRecorrenciaVeiculoModal
          aberto
          recorrenciaId={recorrenciaGerenciada.id}
          aoFechar={() => setRecorrenciaGerenciada(null)}
          aoSalvar={() => recorrenciaAlterada('Recorrência atualizada com sucesso.')}
          aoCancelarRecorrencia={() => recorrenciaAlterada('Recorrência cancelada com sucesso.')}
        />
      )}


      {recorrenciaGerenciada?.modalidade === 'recurso_geral' && (
        <GerenciarRecorrenciaRecursoGeralModal
          aberto
          recorrenciaId={recorrenciaGerenciada.id}
          aoFechar={() => setRecorrenciaGerenciada(null)}
          aoSalvar={() => recorrenciaAlterada('Recorrência atualizada com sucesso.')}
          aoCancelarRecorrencia={() => recorrenciaAlterada('Recorrência cancelada com sucesso.')}
        />
      )}


      {reservaEditando?.modalidade === 'area' && (
        <ReservaAreaModal
          aberto
          areaInicial={areaInicial}
          areas={areas}
          blocos={blocos}
          usuario={reservaEditando.usuario}
          reservaEdicao={reservaEdicao}
          aoFechar={fecharEdicao}
          aoReservar={reservaAtualizada}
        />
      )}


      {reservaEditando?.modalidade ===
        'recurso_geral' && (
        <ReservaRecursoGeralModal
          aberto
          recursoInicial={recursoInicial}
          tipos={tiposRecurso}
          recursos={recursos}
          reservaEdicao={reservaEdicao}
          aoFechar={fecharEdicao}
          aoReservar={reservaAtualizada}
        />
      )}


      {reservaEditando?.modalidade ===
        'veiculo' && (
        <ReservaVeiculoModal
          aberto
          veiculoInicial={veiculoInicial}
          veiculos={veiculos}
          reservaEdicao={reservaEdicao}
          aoFechar={fecharEdicao}
          aoReservar={reservaAtualizada}
        />
      )}


      <ModalConfirmacao
        aberto={Boolean(reservaCancelando)}
        titulo="Cancelar reserva?"
        mensagem={
          reservaCancelando
            ? `Tem certeza que deseja cancelar a reserva "${reservaCancelando.nome}"?`
            : ''
        }
        aviso={erroCancelamento}
        textoConfirmar={
          cancelando
            ? 'Cancelando...'
            : 'Cancelar reserva'
        }
        aoCancelar={fecharCancelamento}
        aoConfirmar={confirmarCancelamento}
      >
        <div className={styles.campoMotivo}>
          <label htmlFor="motivo-cancelamento">
            Motivo do cancelamento *
          </label>

          <textarea
            id="motivo-cancelamento"
            value={motivoCancelamento}
            maxLength={500}
            rows={4}
            disabled={cancelando}
            placeholder="Informe o motivo do cancelamento..."
            onChange={(evento) => {
              setMotivoCancelamento(
                evento.target.value
              );

              if (erroCancelamento) {
                setErroCancelamento('');
              }
            }}
          />

          <small>
            {motivoCancelamento.length}/500
          </small>
        </div>
      </ModalConfirmacao>
    </div>
  );
}


export default ReservasAdmin;
