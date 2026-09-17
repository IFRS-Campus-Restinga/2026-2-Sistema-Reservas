import { useOutletContext } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import styles from "./Home.module.css";
import Banner from "../../components/Banner/Banner";
import CartaoReserva from "../../components/CartaoReserva/CartaoReserva";
import { formatarDataCurta } from "../../utils/data";
import { STATUS_RESERVA_LABEL } from "../../utils/reserva";
import { PAPEL_USUARIO_LABEL } from "../../utils/usuario";

function formatarDataISO(data) {
  return data.toISOString().slice(0, 10);
}

function adicionarDias(data, dias) {
  const resultado = new Date(data);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}

function obterDiasDaSemana(hoje) {
  return Array.from({ length: 7 }, (_, indice) => {
    const data = adicionarDias(hoje, indice);
    return {
      data: formatarDataISO(data),
      rotulo: data.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      dia: data.getDate(),
      hoje: indice === 0,
    };
  });
}

const reservas = [
    {
      id: 1,
      nome: "Reunião de Planejamento",
      descricao: "Sala de Reuniões 3 · Bloco Administrativo",
      status: "confirmada",
      tipo_reserva: "interna",
      data: "2026-09-20",
      horario_inicio: "09:00",
      horario_fim: "10:30",
      duracao: 90,
    },
    {
      id: 2,
      nome: "Aula de Extensão",
      descricao: "Auditório Central",
      status: "pendente",
      tipo_reserva: "externa",
      data: "2026-09-20",
      horario_inicio: "14:00",
      horario_fim: "16:00",
      duracao: 120,
    },
    {
      id: 3,
      nome: "Transporte Visita Técnica",
      descricao: "Van Institucional · Estacionamento B",
      status: "confirmada",
      tipo_reserva: "interna",
      data: "2026-09-14",
      horario_inicio: "07:30",
      horario_fim: "12:00",
      duracao: 270,
    },
    {
      id: 4,
      nome: "Defesa de TCC",
      descricao: "Sala 204 · Bloco B",
      status: "pendente",
      tipo_reserva: "interna",
      data: "2026-09-15",
      horario_inicio: "13:00",
      horario_fim: "15:00",
      duracao: 120,
    },
    {
      id: 5,
      nome: "Workshop Externo",
      descricao: "Laboratório de Informática 2",
      status: "confirmada",
      tipo_reserva: "externa",
      data: "2026-09-16",
      horario_inicio: "08:00",
      horario_fim: "11:00",
      duracao: 180,
    }, 
  ];


function Home() {
  const { usuario } = useOutletContext();

  const hoje = new Date();
  const hojeISO = formatarDataISO(hoje);

  const proximasReservas = [...reservas]
    .filter((reserva) => reserva.data >= hojeISO)
    .sort((a, b) => (a.data + a.horario_inicio).localeCompare(b.data + b.horario_inicio))
    .slice(0, 5);

  const atividadeRecente = [...reservas]
    .filter((reserva) => reserva.data < hojeISO)
    .sort((a, b) => b.id - a.id)
    .slice(0, 3);

  const diasDaSemana = obterDiasDaSemana(hoje).map((dia) => ({
    ...dia,
    temReserva: reservas.some((reserva) => reserva.data === dia.data),
  }));

  const rotuloHoje = hoje.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <div className={styles.pagina}>
      <Banner
        saudacao="Bem-vindo,"
        nome={usuario.nome}
        subtitulo={`${PAPEL_USUARIO_LABEL[usuario.papel] ?? usuario.papel} · ${rotuloHoje}`}
      />

      <div className={styles.grade}>
        <section className={styles.painelReservas}>
          <div className={styles.cabecalhoPainel}>
            <h3 className={styles.tituloPainel}>Minhas próximas reservas</h3>
            <button type="button" className={styles.botaoVerTodas}>
              Ver todas <ArrowRight size={12} />
            </button>
          </div>

          <div className={styles.listaReservas}>
            {proximasReservas.map((reserva) => (
              <CartaoReserva key={reserva.id} reserva={reserva} />
            ))}

            {proximasReservas.length === 0 && (
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
                <div key={reserva.id} className={styles.itemAtividade}>
                  <span className={styles.marcadorStatus} data-status={reserva.status} />
                  <div>
                    <p className={styles.nomeAtividade}>{reserva.nome}</p>
                    <p className={styles.detalheAtividade}>
                      {formatarDataCurta(reserva.data)} · {STATUS_RESERVA_LABEL[reserva.status]}
                    </p>
                  </div>
                </div>
              ))}

              {atividadeRecente.length === 0 && (
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
