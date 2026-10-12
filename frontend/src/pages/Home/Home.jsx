import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUsuario } from "../../hooks/useUsuario";
import { Calendar, ArrowRight } from "lucide-react";
import styles from "./Home.module.css";
import Banner from "../../components/Banner/Banner";
import CartaoReserva from "../../components/CartaoReserva/CartaoReserva";
import { dataParaISO, formatarDataCurta, somarDias } from "../../utils/data";
import { PAPEL_USUARIO_LABEL } from "../../utils/usuario";
import {
  buscarDataAtual,
  listarMinhasReservasAreas,
  buscarVeiculos,
  listarReservasVeiculos,
  listarRecursosGerais,
} from "../../services";
import { listarReservasRecursosGerais } from "../../services/reservasRecursosGerais";

const LIMITE_PROXIMAS = 4;
const LIMITE_ATIVIDADE = 3;
const STATUS_INATIVOS = ["cancelada", "rejeitada"];

const MODALIDADES = {
  recurso_geral: "Recurso geral",
  veiculo: "Veículo",
  area: "Área",
};

// "2026-09-17" -> Date local, sem deslocamento de fuso
function dataDeISO(dataISO) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function obterDiasDaSemana(hoje) {
  const hojeISO = dataParaISO(hoje);
  return Array.from({ length: 7 }, (_, indice) => {
    const dataISO = somarDias(hojeISO, indice);
    const data = dataDeISO(dataISO);
    return {
      data: dataISO,
      rotulo: data
        .toLocaleDateString("pt-BR", { weekday: "short" })
        .replace(".", ""),
      dia: data.getDate(),
      hoje: indice === 0,
    };
  });
}

function hora(valor) {
  return String(valor || "").slice(0, 5);
}

function inicioDaReserva(reserva) {
  return `${reserva.data} ${hora(reserva.horario_inicio)}`;
}

function periodoVeiculo(reserva) {
  if (reserva.modalidade !== "veiculo") return undefined;
  return `${formatarDataCurta(reserva.data)} · ${hora(reserva.horario_inicio)} até ${formatarDataCurta(reserva.data_devolucao_prevista)} · ${hora(reserva.horario_fim)}`;
}

function Home() {
  const usuario = useUsuario();
  const navigate = useNavigate();

  const [agora, setAgora] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    Promise.all([
      buscarDataAtual(),
      listarReservasRecursosGerais(),
      listarMinhasReservasAreas(),
      listarReservasVeiculos(),
      listarRecursosGerais(),
      buscarVeiculos(),
    ])
      .then(
        ([
          dataAtual,
          reservasRecurso,
          reservasArea,
          reservasVeiculo,
          listaRecursos,
          listaVeiculos,
        ]) => {
          setErro("");
          setAgora(dataAtual);
          setRecursos(listaRecursos);
          setVeiculos(listaVeiculos);
          setReservas([
            ...reservasRecurso.map((reserva) => ({
              ...reserva,
              modalidade: "recurso_geral",
            })),
            ...reservasArea.map((reserva) => ({
              ...reserva,
              modalidade: "area",
            })),
            ...reservasVeiculo.map((reserva) => ({
              ...reserva,
              modalidade: "veiculo",
            })),
          ]);
        },
      )
      .catch((falha) => setErro(falha.message));
  }, []);

  function nomeItem(reserva) {
    if (reserva.modalidade === "recurso_geral") {
      const recurso = recursos.find(
        (item) => String(item.id) === String(reserva.recurso_geral),
      );
      return recurso?.nome || `Recurso #${reserva.recurso_geral}`;
    }

    if (reserva.modalidade === "area") {
      return reserva.area_detalhe?.nome || `Área #${reserva.area}`;
    }

    const veiculo = veiculos.find(
      (item) => String(item.id) === String(reserva.veiculo),
    );
    return veiculo
      ? `${veiculo.nome} · ${veiculo.placa}`
      : `Veículo #${reserva.veiculo}`;
  }

  const hoje = agora ? dataDeISO(agora.data) : null;
  const referencia = agora ? `${agora.data} ${agora.hora}` : null;

  const ativas = reservas.filter(
    (reserva) =>
      !STATUS_INATIVOS.includes(String(reserva.status).toLowerCase()),
  );

  const proximasReservas = referencia
    ? ativas
        .filter((reserva) => inicioDaReserva(reserva) >= referencia)
        .sort((a, b) => inicioDaReserva(a).localeCompare(inicioDaReserva(b)))
        .slice(0, LIMITE_PROXIMAS)
    : [];

  const atividadeRecente = referencia
    ? ativas
        .filter((reserva) => inicioDaReserva(reserva) < referencia)
        .sort((a, b) => inicioDaReserva(b).localeCompare(inicioDaReserva(a)))
        .slice(0, LIMITE_ATIVIDADE)
    : [];

  const diasDaSemana = hoje
    ? obterDiasDaSemana(hoje).map((dia) => ({
        ...dia,
        temReserva: ativas.some((reserva) => reserva.data === dia.data),
      }))
    : [];

  const rotuloHoje = hoje
    ? hoje.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      })
    : "";

  return (
    <div className={styles.pagina}>
      <Banner
        saudacao="Bem-vindo,"
        nome={usuario.nome}
        subtitulo={[
          PAPEL_USUARIO_LABEL[usuario.papel] ?? usuario.papel,
          rotuloHoje,
        ]
          .filter(Boolean)
          .join(" · ")}
      />

      {erro && (
        <p role="alert" className={styles.estadoVazio}>
          {erro}
        </p>
      )}

      <div className={styles.grade}>
        <section className={styles.painelReservas}>
          <div className={styles.cabecalhoPainel}>
            <h3 className={styles.tituloPainel}>Minhas próximas reservas</h3>
            <button
              type="button"
              className={styles.botaoVerTodas}
              onClick={() => navigate("/minhas-reservas")}
            >
              Ver todas <ArrowRight size={12} />
            </button>
          </div>

          <div className={styles.listaReservas}>
            {proximasReservas.map((reserva) => (
              <CartaoReserva
                key={`${reserva.modalidade}-${reserva.id}`}
                reserva={{
                  ...reserva,
                  descricao: nomeItem(reserva),
                  horario_inicio: hora(reserva.horario_inicio),
                  horario_fim: hora(reserva.horario_fim),
                }}
                modalidade={MODALIDADES[reserva.modalidade]}
                periodo={periodoVeiculo(reserva)}
              />
            ))}

            {agora && proximasReservas.length === 0 && (
              <div className={styles.estadoVazio}>
                <Calendar size={32} className={styles.iconeVazio} />
                Nenhuma reserva agendada.
              </div>
            )}
          </div>
        </section>

        <aside className={styles.painelLateral}>
          <div className={styles.cartaoCalendario}>
            <h3 className={styles.tituloSecundario}>Esta semana</h3>
            <div className={styles.semana}>
              {diasDaSemana.map((dia) => (
                <div key={dia.data} className={styles.diaSemana}>
                  <span className={styles.rotuloDia}>{dia.rotulo}</span>
                  <div className={styles.numeroDia} data-hoje={dia.hoje}>
                    {dia.dia}
                  </div>
                  {dia.temReserva && <span className={styles.marcadorEvento} />}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.cartaoAtividade}>
            <h3 className={styles.tituloSecundario}>Atividade recente</h3>
            <div className={styles.listaAtividade}>
              {atividadeRecente.map((reserva) => (
                <CartaoReserva
                  key={`${reserva.modalidade}-${reserva.id}`}
                  reserva={{
                    ...reserva,
                    descricao: nomeItem(reserva),
                    horario_inicio: hora(reserva.horario_inicio),
                    horario_fim: hora(reserva.horario_fim),
                  }}
                  modalidade={MODALIDADES[reserva.modalidade]}
                  periodo={periodoVeiculo(reserva)}
                />
              ))}

              {agora && atividadeRecente.length === 0 && (
                <p className={styles.textoVazio}>Nenhuma atividade recente.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Home;
