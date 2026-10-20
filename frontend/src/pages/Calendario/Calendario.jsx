import { useEffect, useState } from "react";
import { Alert, Form } from "react-bootstrap";
import { ClipboardList, Columns, LayoutGrid, Repeat } from "lucide-react";
import { useUsuario } from "../../hooks/useUsuario";
import {
  buscarAreas,
  buscarBlocos,
  buscarDataAtual,
  cancelarReservaArea,
  listarReservasAreas,
} from "../../services";
import ModalDetalheReserva from "../../components/ModalDetalheReserva/ModalDetalheReserva";
import ReservaAreaModal from "../../components/ReservaArea/ReservaAreaModal";
import Select from "../../components/Select/Select";
import { diasDaSemana, horarioParaMinutos } from "../../utils/data";
import { ehAdministrador, podeReservarArea } from "../../utils/permissoes";
import styles from "./Calendario.module.css";

const ALTURA_HORA = 56; // Altura das horas em pixels
const HORA_INICIO = 7;
const HORA_FIM = 23;

const HORAS = Array.from({ length: HORA_FIM - HORA_INICIO + 1 }, (_, i) => HORA_INICIO + i);

const OPCOES_MODO = [
  { valor: "bloco", rotulo: "Por bloco", Icone: LayoutGrid },
  { valor: "area", rotulo: "Por área", Icone: Columns },
];

const OPCOES_VISAO = [
  { valor: "dia", rotulo: "Dia" },
  { valor: "semana", rotulo: "Semana" },
];

function rotuloHora(hora) {
  return `${String(hora).padStart(2, "0")}:00`;
}

function posicaoY(horario) {
  return (horarioParaMinutos(horario) - HORA_INICIO * 60) * (ALTURA_HORA / 60);
}

function alturaReserva(inicio, fim) {
  return (horarioParaMinutos(fim) - horarioParaMinutos(inicio)) * (ALTURA_HORA / 60);
}

function rotuloDiaSemana(dataISO) {
  return new Date(`${dataISO}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
  });
}

function areaDisponivel(area) {
  return area.status === "ATIVO" && area.disponibilidade;
}

function Toggle({ opcoes, valor, aoAlterar, ariaLabel }) {
  return (
    <div className="d-flex bg-light rounded-3 p-1 gap-1" role="group" aria-label={ariaLabel}>
      {opcoes.map(({ valor: valorOpcao, rotulo, Icone }) => (
        <button
          key={valorOpcao}
          type="button"
          aria-pressed={valor === valorOpcao}
          className={`btn btn-sm border-0 d-flex align-items-center gap-1 fw-semibold ${
            valor === valorOpcao ? "bg-white shadow-sm text-dark" : "text-secondary"
          }`}
          onClick={() => aoAlterar(valorOpcao)}
        >
          {Icone && <Icone size={13} />}
          {rotulo}
        </button>
      ))}
    </div>
  );
}

function Calendario() {
  const usuario = useUsuario();

  const [areas, setAreas] = useState([]);
  const [blocos, setBlocos] = useState([]);
  const [agora, setAgora] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const [modo, setModo] = useState("bloco");
  const [blocoId, setBlocoId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [data, setData] = useState("");
  const [visao, setVisao] = useState("dia");

  const [reservas, setReservas] = useState([]);
  const [recarregar, setRecarregar] = useState(0);

  const [reservaDetalhe, setReservaDetalhe] = useState(null);
  const [reservaEdicao, setReservaEdicao] = useState(null);
  const [novaReserva, setNovaReserva] = useState(null);

  const [aviso, setAviso] = useState("");
  const [erro, setErro] = useState("");

  const podeReservar = podeReservarArea(usuario);

  useEffect(() => {
    async function carregarDados() {
      try {
        const [dadosAreas, dadosBlocos, dadosAgora] = await Promise.all([
          buscarAreas(),
          buscarBlocos(),
          buscarDataAtual(),
        ]);

        const areasExibidas = dadosAreas.filter(areaDisponivel);
        const primeiroBloco = [...dadosBlocos]
          .sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))
          .find((bloco) => areasExibidas.some((area) => area.bloco === bloco.id));
        const primeiraArea = areasExibidas.find((area) => area.bloco === primeiroBloco?.id);

        setAreas(dadosAreas);
        setBlocos(dadosBlocos);
        setAgora(dadosAgora);
        setData(dadosAgora.data);
        setBlocoId(String(primeiroBloco?.id ?? ""));
        setAreaId(String(primeiraArea?.id ?? ""));
      } catch (falha) {
        console.error(falha);
        setErro("Não foi possível carregar o calendário.");
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  useEffect(() => {
    if (!data) return;

    const dias = visao === "semana" ? diasDaSemana(data) : [data];
    let descartada = false;

    listarReservasAreas({ dataInicio: dias[0], dataFim: dias[dias.length - 1] })
      .then((lista) => {
        if (descartada) return;
        setReservas(lista);
        setErro("");
      })
      .catch((falha) => {
        if (!descartada) setErro(falha.message);
      });

    return () => {
      descartada = true;
    };
  }, [data, visao, recarregar]);

  function alterarVisao(novaVisao) {
    setVisao(novaVisao);
    if (novaVisao === "semana") setModo("area");
  }

  const areasExibidas = areas.filter(areaDisponivel);

  const gruposAreas = [...blocos]
    .sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))
    .map((bloco) => ({
      bloco,
      areas: areasExibidas.filter((area) => area.bloco === bloco.id),
    }))
    .filter((grupo) => grupo.areas.length > 0);

  const opcoesBloco = gruposAreas.map(({ bloco }) => ({ valor: bloco.id, rotulo: bloco.nome }));
  const gruposSelectArea = gruposAreas.map(({ bloco, areas: areasDoBloco }) => ({
    rotulo: bloco.nome,
    opcoes: areasDoBloco.map((area) => ({ valor: area.id, rotulo: area.nome })),
  }));

  const areasDoBloco = gruposAreas.find(({ bloco }) => String(bloco.id) === blocoId)?.areas ?? [];
  const areaSelecionada = areasExibidas.find((area) => String(area.id) === areaId);

  const colunas =
    visao === "semana"
      ? diasDaSemana(data).map((dia) => ({
          chave: dia,
          titulo: rotuloDiaSemana(dia),
          area: areaSelecionada,
          data: dia,
        }))
      : (modo === "bloco" ? areasDoBloco : [areaSelecionada].filter(Boolean)).map((area) => ({
          chave: area.id,
          titulo: area.nome,
          area,
          data,
        }));

  function reservasDaColuna(coluna) {
    return reservas.filter(
      (reserva) => reserva.area === coluna.area?.id && reserva.data === coluna.data
    );
  }

  function slotLiberado(dataSlot, hora) {
    if (!podeReservar) return false;

    return `${dataSlot} ${rotuloHora(hora)}` > `${agora.data} ${agora.hora}`;
  }

  function podeAlterar(reserva) {
    if (reserva?.celula_timetable) return false;
    return String(reserva.usuario) === String(usuario?.id) || ehAdministrador(usuario);
  }

  function atualizarGrade(mensagem) {
    setAviso(mensagem);
    setRecarregar((contador) => contador + 1);
  }

  async function cancelarDetalhe() {
    await cancelarReservaArea(reservaDetalhe.id);

    setReservaDetalhe(null);
    atualizarGrade("Reserva cancelada.");
  }

  function abrirEdicao(reserva) {
    setReservaDetalhe(null);
    setReservaEdicao(reserva);
  }

  if (carregando) {
    return <p className="text-muted p-4" role="status">Carregando calendário...</p>;
  }

  if (!agora) {
    return <p className="text-danger p-4" role="alert">{erro}</p>;
  }

  return (
    <div className={styles.pagina}>
      <div className="d-flex flex-wrap align-items-center gap-2 bg-white border-bottom px-3 px-md-4 py-3 flex-shrink-0">
        <Form.Control
          type="date"
          size="sm"
          className="w-auto"
          aria-label="Data"
          value={data}
          onChange={(evento) => evento.target.value && setData(evento.target.value)}
        />

        <div className="flex-grow-1" />

        <Toggle
          opcoes={OPCOES_MODO}
          valor={modo}
          aoAlterar={setModo}
          ariaLabel="Modo de visualização"
        />

        {modo === "bloco" ? (
          <Select
            valor={blocoId}
            aoAlterar={setBlocoId}
            opcoes={opcoesBloco}
            ariaLabel="Bloco"
          />
        ) : (
          <Select
            valor={areaId}
            aoAlterar={setAreaId}
            grupos={gruposSelectArea}
            ariaLabel="Área"
          />
        )}

        <Toggle
          opcoes={OPCOES_VISAO}
          valor={visao}
          aoAlterar={alterarVisao}
          ariaLabel="Período"
        />
      </div>

      <div className="d-flex flex-wrap align-items-center column-gap-4 row-gap-1 bg-white border-bottom px-3 px-md-4 py-2 flex-shrink-0">
        <span className="d-flex align-items-center gap-2 small text-secondary fw-medium">
          <span className={styles.legendaCor} data-tipo="interna" />
          Reserva interna (aluno / servidor)
        </span>
        <span className="d-flex align-items-center gap-2 small text-secondary fw-medium">
          <span className={styles.legendaCor} data-tipo="aula" />
          Reserva de aula (recorrente)
        </span>
        <span className="d-flex align-items-center gap-2 small text-secondary fw-medium">
          <span className={styles.legendaCor} data-tipo="externa" />
          Reserva externa (convidado / visitante)
        </span>
        {podeReservar && (
          <span className="small text-muted ms-auto d-none d-md-block">
            Clique em um horário vazio para criar reserva
          </span>
        )}
      </div>

      {aviso && (
        <Alert
          variant="success"
          className="d-flex align-items-center justify-content-between gap-3 mx-3 mx-md-4 my-3 py-2 flex-shrink-0"
        >
          <span>{aviso}</span>
          <button
            type="button"
            className="btn-close flex-shrink-0"
            aria-label="Fechar aviso"
            onClick={() => setAviso("")}
          />
        </Alert>
      )}

      {erro && (
        <Alert variant="danger" className="mx-3 mx-md-4 my-3 py-2 flex-shrink-0" role="alert">
          {erro}
        </Alert>
      )}

      <div className={styles.grade}>
        <div className={styles.conteudoGrade}>
          <div className={`${styles.linhaCabecalho} position-sticky top-0`} style={{ zIndex: 12 }}>
            <div className={styles.cantoHoras} />

            {colunas.map((coluna) => (
              <div key={coluna.chave} className={`${styles.coluna} ${styles.cabecalhoColuna}`}>
                <p className="fs-6 fw-bold text-secondary-emphasis text-capitalize mb-0">
                  {coluna.titulo}
                </p>
                {coluna.area && (
                  <p className="small text-muted mb-0">
                    {coluna.area.capacidade} pax
                  </p>
                )}
              </div>
            ))}

            {colunas.length === 0 && (
              <div className="small text-muted px-3 py-2">Nenhuma área neste bloco.</div>
            )}
          </div>

          <div className={styles.corpo}>
            <div className={styles.colunaHoras}>
              {HORAS.map((hora) => (
                <div key={hora} className={styles.hora} style={{ height: ALTURA_HORA }}>
                  {rotuloHora(hora)}
                </div>
              ))}
            </div>

            {colunas.map((coluna) => {
              const { area } = coluna;
              if (!area) return null;

              return (
                <div
                  key={coluna.chave}
                  className={styles.coluna}
                  style={{ minHeight: (HORA_FIM - HORA_INICIO) * ALTURA_HORA }}
                >
                  {HORAS.slice(0, -1).map((hora, indice) => {
                    const liberado = slotLiberado(coluna.data, hora);

                    return (
                      <button
                        key={hora}
                        type="button"
                        className={`${styles.slot} d-flex align-items-center justify-content-center`}
                        style={{ top: indice * ALTURA_HORA, height: ALTURA_HORA }}
                        disabled={!liberado}
                        aria-label={`Reservar ${area.nome} em ${coluna.data} às ${rotuloHora(hora)}`}
                        onClick={() =>
                          setNovaReserva({ area, data: coluna.data, horario: rotuloHora(hora) })
                        }
                      >
                        {liberado && <span className={styles.slotRotulo}>+ {rotuloHora(hora)}</span>}
                      </button>
                    );
                  })}

                  {reservasDaColuna(coluna).map((reserva) => {
                    const altura = Math.max(
                      alturaReserva(reserva.horario_inicio, reserva.horario_fim),
                      20
                    );
                    const tipoCor = reserva.celula_timetable
                      ? "aula"
                      : String(reserva.tipo_reserva).toLowerCase();

                    return (
                      <button
                        key={`${reserva.id}-${reserva.data}`}
                        type="button"
                        className={`${styles.reserva} ${reserva.recorrencia ? styles.recorrente : ""}`}
                        data-tipo={tipoCor}
                        style={{ top: posicaoY(reserva.horario_inicio) + 1, height: altura - 2 }}
                        onClick={() => setReservaDetalhe(reserva)}
                      >
                        {reserva.recorrencia && (
                          <span
                            className={styles.iconeRecorrencia}
                            role="img"
                            aria-label="Reserva recorrente"
                            title="Reserva recorrente"
                          >
                            <Repeat size={14} />
                          </span>
                        )}
                        <span className={styles.reservaTitulo}>
                          {reserva.nome}
                        </span>
                        {altura > 40 && (
                          <span className={styles.reservaDetalhe}>
                            {reserva.horario_inicio.slice(0, 5)}–{reserva.horario_fim.slice(0, 5)}
                          </span>
                        )}
                        {altura > 58 && (
                          <span className={styles.reservaDetalhe} style={{ textTransform: 'capitalize' }}>
                            {reserva.usuario_detalhe?.nome}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {reservaDetalhe && (
        <ModalDetalheReserva
          reserva={reservaDetalhe}
          modalidade="Área"
          item={reservaDetalhe.area_detalhe?.nome || `Área #${reservaDetalhe.area}`}
          responsavel={reservaDetalhe.usuario_detalhe?.nome || "Não informado"}
          detalhes={[
            {
              rotulo: "Finalidade",
              valor: reservaDetalhe.aula ? "Aula regular" : "Atividade Acadêmica",
              icone: ClipboardList,
            },
            { rotulo: "Observações", valor: reservaDetalhe.descricao || "Nenhuma" },
          ]}
          aoEditar={podeAlterar(reservaDetalhe) ? () => abrirEdicao(reservaDetalhe) : undefined}
          aoCancelar={podeAlterar(reservaDetalhe) ? cancelarDetalhe : undefined}
          motivoAcoesIndisponiveis={
            reservaDetalhe.celula_timetable
              ? "Aulas da grade horária oficial (Timetable) não podem ser alteradas ou canceladas."
              : undefined
          }
          aoFechar={() => setReservaDetalhe(null)}
        />
      )}

      {novaReserva && (
        <ReservaAreaModal
          aberto
          areaInicial={novaReserva.area}
          dataInicial={novaReserva.data}
          horarioInicial={novaReserva.horario}
          areas={areas}
          blocos={blocos}
          usuario={usuario}
          aoFechar={() => setNovaReserva(null)}
          aoReservar={() => {
            setNovaReserva(null);
            atualizarGrade("Reserva criada.");
          }}
        />
      )}

      {reservaEdicao && (
        <ReservaAreaModal
          aberto
          areaInicial={null}
          areas={areas}
          blocos={blocos}
          usuario={usuario}
          reservaEdicao={reservaEdicao}
          aoFechar={() => setReservaEdicao(null)}
          aoReservar={() => {
            setReservaEdicao(null);
            atualizarGrade("Reserva atualizada.");
          }}
        />
      )}
    </div>
  );
}

export default Calendario;
