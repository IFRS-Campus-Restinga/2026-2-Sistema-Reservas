
import { useEffect, useState } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { Row, Col } from 'react-bootstrap';
import { CalendarCheck, ClipboardList } from 'lucide-react';
import CartaoReserva from '../../components/CartaoReserva/CartaoReserva';
import ModalDetalheReserva from '../../components/ModalDetalheReserva/ModalDetalheReserva';
import ReservaRecursoGeralModal from '../../components/ReservaRecursoGeral/ReservaRecursoGeralModal';
import ReservaAreaModal from '../../components/ReservaArea/ReservaAreaModal';
import Select from '../../components/Select/Select';
import {
  listarRecursosGerais,
  listarTiposRecurso,
  listarMinhasReservasAreas,
  cancelarReservaArea,
  buscarAreas,
  buscarBlocos,
} from '../../services';
import {
  listarReservasRecursosGerais,
  cancelarReservaRecursoGeral,
} from '../../services/reservasRecursosGerais';
import { STATUS_RESERVA_LABEL } from '../../utils/reserva';
import styles from './MinhasReservas.module.css';

const STATUS_ALTERAVEIS = {
  recurso_geral: ['PENDENTE', 'AGUARDANDO_TERMO'],
  area: ['PENDENTE', 'CONFIRMADA'],
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

const STATUS_VARIANTE = {
  confirmada: 'success',
  pendente: 'warning',
  cancelada: 'secondary',
  rejeitada: 'danger',
  aguardando_termo: 'info',
  concluida: 'primary',
};

function formatarData(data) {
  if (!data) return '';

  return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR');
}

function MinhasReservas() {
  const { usuario } = useOutletContext();
  const location = useLocation();

  const [reservas, setReservas] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [areas, setAreas] = useState([]);
  const [blocos, setBlocos] = useState([]);
  const [editando, setEditando] = useState(null);
  const [editandoArea, setEditandoArea] = useState(null);
  const [selecionada, setSelecionada] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState(
    location.state?.criada
      ? 'Reserva enviada! Acompanhe sua reserva abaixo.'
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
    ])
      .then(([listaReservasRecurso, listaRecursos, listaTipos, listaReservasArea, listaAreas, listaBlocos]) => {
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
        ]);

        setRecursos(listaRecursos);
        setTipos(listaTipos);
        setAreas(listaAreas);
        setBlocos(listaBlocos);
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

    return reserva.item || reserva.descricao || 'Não informado';
  }

  function detalhesDaReserva(reserva) {
    if (reserva.modalidade === 'recurso_geral') {
      return [
        {
          rotulo: 'Finalidade',
          valor: 'Empréstimo de recurso',
          icone: ClipboardList,
        },
        {
          rotulo: 'Quantidade',
          valor: reserva.quantidades,
          icone: ClipboardList,
        },
        {
          rotulo: 'Devolução prevista',
          valor: formatarData(reserva.data_devolucao_prevista),
          icone: CalendarCheck,
        },
        {
          rotulo: 'Observações',
          valor: reserva.descricao || 'Nenhuma',
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

    return reserva.detalhes || [];
  }

  function podeAlterar(reserva) {
    return (STATUS_ALTERAVEIS[reserva?.modalidade] || []).includes(reserva?.status);
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

  const reservasDoTipo = filtroTipo === 'todos'
    ? reservas
    : reservas.filter((reserva) => reserva.modalidade === filtroTipo);

  const contagemPorStatus = reservasDoTipo.reduce((contagem, reserva) => {
    const status = String(reserva.status || '').toLowerCase();
    contagem[status] = (contagem[status] || 0) + 1;
    return contagem;
  }, {});

  const ordenadas = [...reservasDoTipo]
    .filter((reserva) =>
      filtroStatus === 'todos' || String(reserva.status || '').toLowerCase() === filtroStatus
    )
    .sort((a, b) =>
      `${b.data} ${b.horario_inicio}`.localeCompare(
        `${a.data} ${a.horario_inicio}`
      )
    );

  const recurso =
    selecionada?.modalidade === 'recurso_geral'
      ? recursoDaReserva(selecionada)
      : null;

  const ehRecurso = selecionada?.modalidade === 'recurso_geral';

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
          rotuloTodos="Todos os status"
          ariaLabel="Filtrar por status"
        />
      </div>

      <Row xs={2} md={3} xl={6} className="g-3">
        {Object.entries(STATUS_RESERVA_LABEL).map(([status, rotulo]) => {
          const variante = STATUS_VARIANTE[status] || 'secondary';

          return (
            <Col key={status}>
              <div className={`rounded-4 p-4 text-center bg-${variante}-subtle`}>
                <div className={`fs-2 fw-bold text-${variante}-emphasis`}>
                  {contagemPorStatus[status] || 0}
                </div>
                <div className={`small text-${variante}-emphasis`}>{rotulo}</div>
              </div>
            </Col>
          );
        })}
      </Row>

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
          exigeTermo={
            ehRecurso
              ? Boolean(recurso?.tem_termo_de_responsabilidade)
              : Boolean(selecionada.exigeTermo)
          }
          detalhes={detalhesDaReserva(selecionada)}
          aoEditar={podeAlterar(selecionada) ? () => abrirEdicao(selecionada) : undefined}
          aoCancelar={podeAlterar(selecionada) ? cancelarSelecionada : undefined}
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
    </div>
  );
}

export default MinhasReservas;
