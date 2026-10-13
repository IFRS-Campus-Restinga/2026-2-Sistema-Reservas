
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useUsuario } from '../../hooks/useUsuario';
import { ClipboardList, Info, Package, UserRound } from 'lucide-react';
import CartaoReserva from '../../components/CartaoReserva/CartaoReserva';
import ModalDetalheReserva from '../../components/ModalDetalheReserva/ModalDetalheReserva';
import ReservaRecursoGeralModal from '../../components/ReservaRecursoGeral/ReservaRecursoGeralModal';
import ReservaAreaModal from '../../components/ReservaArea/ReservaAreaModal';
import ReservaVeiculoModal from '../../components/ReservaVeiculo/ReservaVeiculoModal';
import TermoReserva from '../../components/TermoReserva/TermoReserva';
import Select from '../../components/Select/Select';
import {
  listarRecursosGerais,
  listarTiposRecurso,
  listarMinhasReservasAreas,
  cancelarReservaArea,
  buscarAreas,
  buscarBlocos,
  buscarVeiculos,
  listarReservasVeiculos,
  cancelarReservaVeiculo,
} from '../../services';
import {
  listarReservasRecursosGerais,
  cancelarReservaRecursoGeral,
} from '../../services/reservasRecursosGerais';
import { STATUS_RESERVA_LABEL } from '../../utils/reserva';
import { ehAdministrador } from '../../utils/permissoes';
import styles from './MinhasReservas.module.css';

const STATUS_ALTERAVEIS = {
  recurso_geral: ['PENDENTE', 'AGUARDANDO_TERMO'],
  area: ['PENDENTE', 'CONFIRMADA'],
  veiculo: ['PENDENTE', 'AGUARDANDO_TERMO', 'CONFIRMADA'],
};

const MODALIDADES = {
  recurso_geral: 'Recurso geral',
  veiculo: 'Veículo',
  area: 'Área',
  espaco: 'Espaço',
  sala: 'Sala',
};

const OPCOES_TIPO = [
  { valor: 'area', rotulo: 'Áreas' },
  { valor: 'veiculo', rotulo: 'Veículos' },
  { valor: 'recurso_geral', rotulo: 'Recursos' },
];

const OPCOES_STATUS = Object.entries(STATUS_RESERVA_LABEL).map(([valor, rotulo]) => ({
  valor,
  rotulo,
}));

function formatarData(data) {
  if (!data) return '';

  return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR');
}

function MinhasReservas() {
  const usuario = useUsuario();
  const location = useLocation();

  const [reservas, setReservas] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [areas, setAreas] = useState([]);
  const [blocos, setBlocos] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [editando, setEditando] = useState(null);
  const [editandoArea, setEditandoArea] = useState(null);
  const [editandoVeiculo, setEditandoVeiculo] = useState(null);
  const [selecionada, setSelecionada] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState(
    location.state?.criada
      ? location.state?.tipo === 'veiculo'
        ? 'Reserva registrada — aguardando termo.'
        : 'Reserva enviada! Acompanhe sua reserva abaixo.'
      : ''
  );

  useEffect(() => {
    Promise.all([
      listarReservasRecursosGerais(),
      listarRecursosGerais(),
      listarTiposRecurso(),
      listarMinhasReservasAreas(),
      buscarAreas(),
      buscarBlocos(),
      listarReservasVeiculos(),
      buscarVeiculos(),
    ])
      .then(([listaReservasRecurso, listaRecursos, listaTipos, listaReservasArea, listaAreas, listaBlocos, listaReservasVeiculo, listaVeiculos]) => {
        setErro('');

        setReservas([
          ...listaReservasRecurso.map((reserva) => ({
            ...reserva,
            modalidade: 'recurso_geral',
          })),
          ...listaReservasArea.map((reserva) => ({
            ...reserva,
            modalidade: 'area',
          })),
          ...listaReservasVeiculo.map((reserva) => ({
            ...reserva,
            modalidade: 'veiculo',
          })),
        ]);

        setRecursos(listaRecursos);
        setTipos(listaTipos);
        setAreas(listaAreas);
        setBlocos(listaBlocos);
        setVeiculos(listaVeiculos);
      })
      .catch((falha) => setErro(falha.message));
  }, []);

  function recursoDaReserva(reserva) {
    return recursos.find(
      (recurso) => String(recurso.id) === String(reserva.recurso_geral)
    );
  }

  function nomeItem(reserva) {
    if (reserva.modalidade === 'recurso_geral') {
      return recursoDaReserva(reserva)?.nome || `Recurso #${reserva.recurso_geral}`;
    }

    if (reserva.modalidade === 'area') {
      return reserva.area_detalhe?.nome || `Área #${reserva.area}`;
    }

    if (reserva.modalidade === 'veiculo') {
      const veiculo = veiculos.find((item) => String(item.id) === String(reserva.veiculo));
      return veiculo ? `${veiculo.nome} · ${veiculo.placa}` : `Veículo #${reserva.veiculo}`;
    }

    return reserva.item || reserva.descricao || 'Não informado';
  }

  function detalhesDaReserva(reserva) {
    if (reserva.modalidade === 'recurso_geral') {
      return [
        {
          rotulo: 'Finalidade',
          valor: reserva.descricao || 'Empréstimo de recurso',
          icone: Info,
        },
        {
          rotulo: 'Quantidade',
          valor: `${reserva.quantidades} unidade(s) · devolução até ${formatarData(reserva.data_devolucao_prevista)}`,
          icone: Package,
        },
      ];
    }

    if (reserva.modalidade === 'area') {
      return [
        {
          rotulo: 'Finalidade',
          valor: reserva.aula ? 'Aula regular' : 'Atividade Acadêmica',
          icone: ClipboardList,
        },
        {
          rotulo: 'Observações',
          valor: reserva.descricao || 'Nenhuma',
        },
      ];
    }

    if (reserva.modalidade === 'veiculo') {
      return [
        { rotulo: 'Finalidade', valor: reserva.finalidade, icone: Info },
        {
          rotulo: 'Destino e ocupantes',
          valor: `${reserva.destino} · ${reserva.quantidade_passageiros} ocupante(s), incluindo motorista`,
          icone: UserRound,
        },
        { rotulo: 'Observações', valor: reserva.descricao },
      ];
    }

    return reserva.detalhes || [];
  }

  function podeAlterar(reserva) {
    const statusAberto = (STATUS_ALTERAVEIS[reserva?.modalidade] || []).includes(reserva?.status);
    if (!statusAberto || reserva?.modalidade !== 'veiculo') return statusAberto;
    if (ehAdministrador(usuario)) return true;

    const inicio = new Date(`${reserva.data}T${reserva.horario_inicio}`);
    return new Date() <= new Date(inicio.getTime() - 60 * 60 * 1000);
  }

  function motivoIndisponivel(reserva) {
    if (!reserva || reserva.modalidade !== 'veiculo') return '';
    const statusAberto = STATUS_ALTERAVEIS.veiculo.includes(reserva.status);
    if (!statusAberto) return 'Esta reserva está em um estado final e não pode mais ser alterada.';
    if (!ehAdministrador(usuario) && !podeAlterar(reserva)) {
      return 'O prazo para editar ou cancelar encerrou uma hora antes da retirada.';
    }
    return '';
  }

  function nomeResponsavel(reserva) {
    if (String(reserva.usuario) === String(usuario?.id)) {
      return usuario.nome;
    }

    return reserva.usuario_nome || 'Não informado';
  }

  async function cancelarSelecionada() {
    const modalidade = selecionada.modalidade;
    const atualizada = modalidade === 'area'
      ? await cancelarReservaArea(selecionada.id)
      : modalidade === 'veiculo'
        ? await cancelarReservaVeiculo(selecionada.id)
        : await cancelarReservaRecursoGeral(selecionada.id);

    setReservas((atuais) =>
      atuais.map((reserva) =>
        reserva.modalidade === modalidade &&
        reserva.id === atualizada.id
          ? { ...atualizada, modalidade }
          : reserva
      )
    );

    setSelecionada(null);
    setAviso('Reserva cancelada.');
  }

  function abrirEdicao(reserva) {
    if (reserva.modalidade === 'area') {
      setSelecionada(null);
      setEditandoArea(reserva);
      return;
    }

    if (reserva.modalidade === 'veiculo') {
      const veiculo = veiculos.find((item) => String(item.id) === String(reserva.veiculo));
      if (!veiculo) {
        setErro('Não foi possível encontrar o veículo desta reserva.');
        return;
      }
      setSelecionada(null);
      setEditandoVeiculo({ reserva, veiculo });
      return;
    }

    const recurso = recursoDaReserva(reserva);

    const tipo = tipos.find(
      (item) => String(item.id) === String(recurso?.tipo_recurso)
    );

    if (!recurso || !tipo) {
      setErro('Não foi possível encontrar o recurso desta reserva.');
      return;
    }

    setSelecionada(null);

    setEditando({
      reserva,
      recurso,
      tipo: {
        ...tipo,
        recursos: recursos.filter(
          (item) => String(item.tipo_recurso) === String(tipo.id)
        ),
      },
    });
  }

  function salvarEdicao(atualizada) {
    setReservas((atuais) =>
      atuais.map((reserva) =>
        reserva.modalidade === 'recurso_geral' &&
        String(reserva.id) === String(atualizada.id)
          ? { ...atualizada, modalidade: 'recurso_geral' }
          : reserva
      )
    );

    setEditando(null);
    setAviso('Reserva atualizada.');
  }

  function salvarEdicaoArea(atualizada) {
    setReservas((atuais) =>
      atuais.map((reserva) =>
        reserva.modalidade === 'area' &&
        String(reserva.id) === String(atualizada.id)
          ? { ...atualizada, modalidade: 'area' }
          : reserva
      )
    );

    setEditandoArea(null);
    setAviso('Reserva atualizada.');
  }

  function salvarEdicaoVeiculo(atualizada) {
    setReservas((atuais) => atuais.map((reserva) =>
      reserva.modalidade === 'veiculo' && String(reserva.id) === String(atualizada.id)
        ? { ...atualizada, modalidade: 'veiculo' }
        : reserva
    ));
    setEditandoVeiculo(null);
    setAviso('Reserva atualizada.');
  }

  function periodoVeiculo(reserva) {
    if (reserva?.modalidade !== 'veiculo') return undefined;
    return `${formatarData(reserva.data)} · ${String(reserva.horario_inicio).slice(0, 5)} até ${formatarData(reserva.data_devolucao_prevista)} · ${String(reserva.horario_fim).slice(0, 5)}`;
  }

  const reservasDoTipo = filtroTipo === 'todos'
    ? reservas
    : reservas.filter((reserva) => reserva.modalidade === filtroTipo);

  const ordenadas = [...reservasDoTipo]
    .filter((reserva) => {
      const status = String(reserva.status || '').toLowerCase();
      return filtroStatus === 'todos' ? status !== 'cancelada' : status === filtroStatus;
    })
    .sort((a, b) =>
      `${b.data} ${b.horario_inicio}`.localeCompare(
        `${a.data} ${a.horario_inicio}`
      )
    );

  function atualizarSituacaoTermo(dados) {
    setReservas((atuais) => atuais.map((reserva) => {
      if (reserva.id === dados.reserva) {
        return { ...reserva, status: dados.status_reserva };
      }
      return reserva;
    }));
    setSelecionada((atual) => {
      if (atual?.id === dados.reserva) {
        return { ...atual, status: dados.status_reserva };
      }
      return atual;
    });
  }

  return (
    <div className={styles.pagina}>
      {aviso && (
        <p className={styles.aviso}>
          {aviso}
        </p>
      )}

      {erro && (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      )}

      <div className="d-flex flex-wrap gap-2">
        <Select
          valor={filtroTipo}
          aoAlterar={setFiltroTipo}
          opcoes={OPCOES_TIPO}
          valorTodos="todos"
          rotuloTodos="Todos os tipos"
          ariaLabel="Filtrar por tipo"
        />

        <Select
          valor={filtroStatus}
          aoAlterar={setFiltroStatus}
          opcoes={OPCOES_STATUS}
          valorTodos="todos"
          rotuloTodos="Todas"
          ariaLabel="Filtrar por status"
        />
      </div>

      <section className={styles.lista} aria-label="Minhas reservas">
        {ordenadas.length === 0 && (
          <p className={styles.vazio}>
            Você ainda não possui reservas cadastradas.
          </p>
        )}

        {ordenadas.map((reserva) => (
          <CartaoReserva
            key={`${reserva.modalidade}-${reserva.id}`}
            reserva={{
              ...reserva,
              descricao: nomeItem(reserva),
            }}
            modalidade={MODALIDADES[reserva.modalidade] || 'Reserva'}
            periodo={periodoVeiculo(reserva)}
            mostrarStatus={true}
            aoClicar={() => setSelecionada(reserva)}
          />
        ))}
      </section>

      {selecionada && (
        <ModalDetalheReserva
          reserva={selecionada}
          modalidade={MODALIDADES[selecionada.modalidade] || 'Reserva'}
          item={nomeItem(selecionada)}
          responsavel={nomeResponsavel(selecionada)}
          periodo={periodoVeiculo(selecionada)}
          exigeTermo={selecionada.modalidade === 'veiculo' || Boolean(recursoDaReserva(selecionada)?.tem_termo_de_responsabilidade)}
          aoAtualizarTermo={atualizarSituacaoTermo}
          conteudoExtra={selecionada.modalidade === 'veiculo' ? (
            <>
              <TermoReserva reservaId={selecionada.id} modalidade="veiculo" tipoDocumento="retirada" ocultarIndisponivel />
              <TermoReserva reservaId={selecionada.id} modalidade="veiculo" tipoDocumento="devolucao" ocultarIndisponivel />
            </>
          ) : null}
          detalhes={detalhesDaReserva(selecionada)}
          aoEditar={podeAlterar(selecionada) ? () => abrirEdicao(selecionada) : undefined}
          aoCancelar={podeAlterar(selecionada) ? cancelarSelecionada : undefined}
          motivoAcoesIndisponiveis={motivoIndisponivel(selecionada)}
          aoFechar={() => setSelecionada(null)}
        />
      )}

      {editando && (
        <ReservaRecursoGeralModal
          aberto
          tipo={editando.tipo}
          recursoInicial={editando.recurso}
          reservaEdicao={editando.reserva}
          aoFechar={() => setEditando(null)}
          aoReservar={salvarEdicao}
        />
      )}

      {editandoArea && (
        <ReservaAreaModal
          aberto
          areaInicial={null}
          areas={areas}
          blocos={blocos}
          usuario={usuario}
          reservaEdicao={editandoArea}
          aoFechar={() => setEditandoArea(null)}
          aoReservar={salvarEdicaoArea}
        />
      )}

      {editandoVeiculo && (
        <ReservaVeiculoModal
          aberto
          veiculoInicial={editandoVeiculo.veiculo}
          veiculos={veiculos}
          reservaEdicao={editandoVeiculo.reserva}
          aoFechar={() => setEditandoVeiculo(null)}
          aoReservar={salvarEdicaoVeiculo}
        />
      )}
    </div>
  );
}

export default MinhasReservas;
