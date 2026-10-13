import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUsuario } from "../../hooks/useUsuario";
import { ArrowLeft, CheckCircle, Users } from "lucide-react";
import { buscarAgendaArea, buscarArea, buscarAreas, buscarBlocos } from "../../services";
import ReservaAreaModal from "../../components/ReservaArea/ReservaAreaModal";
import { ICONE_AREA_PADRAO, TIPO_AREA_ICONE, TIPO_AREA_LABEL } from "../../utils/tipoArea";
import { EQUIPAMENTO_LABELS } from "../../utils/equipamentoArea";
import { ACESSIBILIDADE_LABELS } from "../../utils/acessibilidadeBloco";
import styles from "./AreaDetalhe.module.css";

function formatarIntervalo(reserva) {
  return `${reserva.horario_inicio.slice(0, 5)}–${reserva.horario_fim.slice(0, 5)}`;
}

function AreaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const usuario = useUsuario();

  const [area, setArea] = useState(null);
  const [areas, setAreas] = useState([]);
  const [blocos, setBlocos] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mostrarReserva, setMostrarReserva] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);
        setErro("");

        const [dadosArea, dadosAreas, dadosBlocos, dadosAgenda] = await Promise.all([
          buscarArea(id),
          buscarAreas(),
          buscarBlocos(),
          buscarAgendaArea(id),
        ]);

        setArea(dadosArea);
        setAreas(dadosAreas);
        setBlocos(dadosBlocos);
        setAgenda(dadosAgenda);
      } catch (erro) {
        console.error(erro);
        setErro("Área não encontrada.");
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, [id]);

  if (carregando) {
    return <p className="text-muted p-4" role="status">Carregando área...</p>;
  }

  if (erro || !area) {
    return <p className="text-danger p-4" role="alert">{erro || "Área não encontrada."}</p>;
  }

  const blocoDaArea = blocos.find((bloco) => bloco.id === area.bloco);
  const IconeTipo = TIPO_AREA_ICONE[area.tipo] ?? ICONE_AREA_PADRAO;

  return (
    <div className="p-3 p-md-4">
      <button
        type="button"
        className={`btn btn-link p-0 mb-3 d-inline-flex align-items-center gap-2 text-decoration-none ${styles.voltar}`}
        onClick={() => navigate("/areas")}
      >
        <ArrowLeft size={16} /> Voltar para áreas
      </button>

      <div className="bg-white rounded-4 border overflow-hidden">
        <div className={`px-4 py-5 text-white ${styles.cabecalho}`}>
          <div className="d-flex align-items-start gap-3">
            <div className="d-flex align-items-center justify-content-center rounded-3 bg-white bg-opacity-25 flex-shrink-0" style={{ width: 56, height: 56 }}>
              <IconeTipo size={28} />
            </div>

            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="small text-white-50">{blocoDaArea?.nome}</span>
                <span className="badge rounded-pill bg-white bg-opacity-25 text-white">
                  {TIPO_AREA_LABEL[area.tipo] || area.tipo}
                </span>
              </div>
              <h2 className="fw-bold mb-2">{area.nome}</h2>
              <span className="d-inline-flex align-items-center gap-1 small">
                <Users size={14} /> {area.capacidade} pax
              </span>
            </div>
          </div>
        </div>

        <div className="row g-4 p-4">
          <div className="col-md-6">
            <h3 className="fs-6 fw-semibold mb-2">Informações</h3>
            <p className="small text-muted mb-3">{area.caracteristica}</p>

            {blocoDaArea && (
              <div className="d-flex flex-wrap gap-2 mb-3">
                {blocoDaArea.banheiro && (
                  <span className="badge rounded-pill bg-light text-secondary fw-normal">
                    Banheiro no bloco
                  </span>
                )}
                {blocoDaArea.acessibilidade.map((item) => (
                  <span key={item} className="badge rounded-pill bg-light text-secondary fw-normal">
                    {ACESSIBILIDADE_LABELS[item] || item}
                  </span>
                ))}
              </div>
            )}

            <h4 className="text-uppercase text-muted small fw-semibold mb-2">Equipamentos</h4>
            <div className="d-flex flex-wrap gap-2">
              {area.equipamento.length === 0 && (
                <span className="small text-muted">Nenhum equipamento cadastrado.</span>
              )}
              {area.equipamento.map((item) => (
                <span key={item} className="badge rounded-pill bg-light text-secondary fw-normal">
                  {EQUIPAMENTO_LABELS[item] || item}
                </span>
              ))}
            </div>
          </div>

          <div className="col-md-6">
            <h3 className="fs-6 fw-semibold mb-2">Agenda de hoje</h3>

            {agenda.length === 0 ? (
              <div className="bg-success-subtle rounded-3 p-3 text-center">
                <CheckCircle size={20} className="text-success d-block mx-auto mb-1" />
                <p className="small text-success-emphasis fw-medium mb-0">Disponível o dia todo</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {agenda.map((reserva) => (
                  <div className={styles.itemAgenda} key={reserva.id}>
                    <span className={styles.barra} />
                    <div>
                      <strong className="small d-block">{reserva.nome}</strong>
                      <span className="text-muted d-block">
                        {formatarIntervalo(reserva)} · <span className={styles.nomeUsuario}>{reserva.usuario_nome}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {area.status === "ATIVO" && (
          <div className="px-4 pb-4">
            <button
              type="button"
              className="btn btn-success w-100 py-2 fw-semibold rounded-3"
              onClick={() => setMostrarReserva(true)}
            >
              Reservar {area.nome}
            </button>
          </div>
        )}
      </div>

      <ReservaAreaModal
        aberto={mostrarReserva}
        areaInicial={area}
        areas={areas}
        blocos={blocos}
        usuario={usuario}
        aoFechar={() => setMostrarReserva(false)}
        aoReservar={() => navigate("/minhas-reservas", { state: { criada: true } })}
      />
    </div>
  );
}

export default AreaDetalhe;
