import { useCallback, useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import Paginacao from '../Paginacao/Paginacao';
import styles from './ReservasAdmin.module.css';
import RelatorioUso from '../RelatorioUso/RelatorioUso';
import SelectRemoto from '../../SelectRemoto/SelectRemoto';

import {
  buscarAreas,
  buscarBlocos,
  cancelarReservaAdmin,
  listarReservasAdmin,
} from '../../../services';
import { consultarTodasPaginas } from '../../../services/paginacao';

import CampoBusca from '../CampoBusca/CampoBusca';
import BarraFiltros from '../../BarraFiltros/BarraFiltros';
import CampoPeriodo from '../../CampoPeriodo/CampoPeriodo';
import TabelaAdministracao from '../TabelaAdmin/TabelaAdmin';
import ModalConfirmacao from '../ModalConfirmacao/ModalConfirmacao';
import Select from '../../Select/Select';

import ModalDetalheReserva from '../../ModalDetalheReserva/ModalDetalheReserva';

import ReservaAreaModal from '../../ReservaArea/ReservaAreaModal';

import ReservaRecursoGeralModal from '../../ReservaRecursoGeral/ReservaRecursoGeralModal';

import ReservaVeiculoModal from '../../ReservaVeiculo/ReservaVeiculoModal';

import { STATUS_RESERVA_LABEL } from '../../../utils/reserva';

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


function periodoReserva(reserva) {
  const inicio = formatarHorario(reserva.horario_inicio);
  const fim = formatarHorario(reserva.horario_fim);
  const devolucao = reserva.detalhes?.data_devolucao_prevista;

  if (devolucao && devolucao !== reserva.data) {
    return {
      datas: `${formatarData(reserva.data)} até ${formatarData(devolucao)}`,
      horarios: `Retirada ${inicio} · Devolução ${fim}`,
    };
  }

  return {
    datas: formatarData(reserva.data),
    horarios: `${inicio}–${fim}`,
  };
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
  const [filtroTiposRecurso, setFiltroTiposRecurso] = useState([]);
  const [periodo, setPeriodo] = useState({ inicio: '', fim: '' });

  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);

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
            tipo_recurso: modalidade === 'recurso_geral' ? filtroTiposRecurso.join(',') : '',
            data_inicio: periodo.inicio,
            data_fim: periodo.fim,
            page: pagina,
            page_size: TAMANHO_PAGINA,
          },
          signal
        );

      if (signal?.aborted) {
        return;
      }

      setReservas(resultado.results || []);
      setTotal(resultado.count || 0);
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
  }, [busca, modalidade, filtroTiposRecurso, periodo, pagina]);

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


  function solicitarCancelamento(reserva) {
    setMensagemSucesso('');
    setErroCancelamento('');
    setMotivoCancelamento('');
    setReservaCancelando(reserva);
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
      renderizar: (reserva) => (
        <button
          type="button"
          className={styles.nomeReserva}
          onClick={() =>
            setReservaDetalhes(reserva)
          }
        >
          {reserva.nome}
        </button>
      ),
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
      chave: 'data',
      titulo: 'Data',
      renderizar: (reserva) => {
        const { datas, horarios } = periodoReserva(reserva);

        return (
          <div className={styles.dadoPrincipal}>
            <span>{datas}</span>
            <small>{horarios}</small>
          </div>
        );
      },
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
        const gerenciavel =
          podeGerenciar(reserva);

        const motivoBloqueio =
          reserva.detalhes?.celula_timetable
            ? 'Reservas do Timetable são gerenciadas pela sincronização.'
            : 'Esta reserva não pode mais ser alterada.';

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
        <div>
          <h2>Reservas</h2>

          <p>
            Consulte e gerencie todas as reservas
            do sistema.
          </p>
        </div>

        <span className={styles.contador}>
          {total}{' '}
          {total === 1
            ? 'reserva'
            : 'reservas'}
        </span>
      </div>

      <BarraFiltros acoes={<RelatorioUso />}>
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
            setFiltroTiposRecurso([]);
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
        {modalidade === 'recurso_geral' && (
          <SelectRemoto
            url="/api/tipos-recurso/"
            valor={filtroTiposRecurso}
            aoAlterar={(valor) => {
              setFiltroTiposRecurso(valor);
              setPagina(1);
            }}
            rotuloTodos="Todos os tipos de recurso"
            ariaLabel="Filtrar reservas por tipo de recurso geral"
            placeholderBusca="Buscar tipo..."
            multiplo
          />
        )}
        <CampoPeriodo
          inicio={periodo.inicio}
          fim={periodo.fim}
          aoAlterar={(valor) => {
            setPeriodo(valor);
            setPagina(1);
          }}
          ariaLabel="Filtrar reservas por período"
        />
      </BarraFiltros>


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
            mensagemVazia={
              busca.trim() ||
              modalidade !== 'todas' ||
              periodo.inicio ||
              periodo.fim
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
            ? `${formatarData(
                reservaDetalhes.data
              )} · ${formatarHorario(
                reservaDetalhes.horario_inicio
              )} às ${formatarHorario(
                reservaDetalhes.horario_fim
              )}`
            : ''
        }
        detalhes={
          reservaDetalhes
            ? [
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
        aoFechar={() =>
          setReservaDetalhes(null)
        }
      />


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