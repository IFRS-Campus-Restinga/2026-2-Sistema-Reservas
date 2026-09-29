import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col } from "react-bootstrap";
import { Search } from "lucide-react";
import { buscarAreas, buscarBlocos } from "../../services";
import CampoBusca from "../../components/Administracao/CampoBusca/CampoBusca";
import Select from "../../components/Select/Select";
import CardArea from "../../components/CardArea/CardArea";
import styles from "./Areas.module.css";

const OPCOES_CAPACIDADE = [
  { valor: 20, rotulo: "20+ pessoas" },
  { valor: 40, rotulo: "40+ pessoas" },
  { valor: 80, rotulo: "80+ pessoas" },
];
  
function Areas() {
  const navigate = useNavigate();

  const [areas, setAreas] = useState([]);
  const [blocos, setBlocos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");
  const [filtroBloco, setFiltroBloco] = useState("todos");
  const [filtroCapacidade, setFiltroCapacidade] = useState("0");

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);
        setErro("");

        const [dadosAreas, dadosBlocos] = await Promise.all([
          buscarAreas(),
          buscarBlocos(),
        ]);

        setAreas(dadosAreas);
        setBlocos(dadosBlocos);
      } catch (erro) {
        console.error(erro);
        setErro("Não foi possível carregar as áreas.");
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  const opcoesBloco = blocos.map((bloco) => ({ valor: bloco.id, rotulo: bloco.nome }));

  const termo = busca.trim().toLowerCase();
  const areasFiltradas = areas.filter((area) => {
    const combinaNome = area.nome.toLowerCase().includes(termo);
    const combinaBloco = filtroBloco === "todos" || String(area.bloco) === String(filtroBloco);
    const combinaCapacidade =
      Number(filtroCapacidade) === 0 || area.capacidade >= Number(filtroCapacidade);

    return combinaNome && combinaBloco && combinaCapacidade;
  });

  return (
    <div className="d-flex flex-column gap-4 p-3 p-md-4">
      <div className="d-flex flex-wrap align-items-center justify-content-center gap-2">
        <CampoBusca valor={busca} aoAlterar={setBusca} placeholder="Buscar área" />

        <Select
          valor={filtroBloco}
          aoAlterar={setFiltroBloco}
          opcoes={opcoesBloco}
          valorTodos="todos"
          rotuloTodos="Todos os blocos"
          ariaLabel="Filtrar por bloco"
        />

        <Select
          valor={filtroCapacidade}
          aoAlterar={setFiltroCapacidade}
          opcoes={OPCOES_CAPACIDADE}
          valorTodos={0}
          rotuloTodos="Qualquer capacidade"
          ariaLabel="Filtrar por capacidade"
        />
      </div>

      {erro && (
        <p className="text-danger" role="alert">{erro}</p>
      )}

      {carregando ? (
        <p className="text-muted" role="status">Carregando áreas...</p>
      ) : areasFiltradas.length === 0 ? (
        <div className={`text-center bg-white border rounded-3 py-5 px-3 text-muted ${styles.vazio}`}>
          <Search size={32} className="d-block mx-auto mb-2 opacity-25" />
          <p className="small mb-0">Nenhuma área encontrada.</p>
        </div>
      ) : (
        <Row xs={1} sm={2} md={3} lg={4} className="g-3">
          {areasFiltradas.map((area) => (
            <Col key={area.id}>
              <CardArea
                area={area}
                blocoNome={blocos.find((bloco) => bloco.id == area.bloco)?.nome}
                aoClicar={(area) => navigate(`/areas/${area.id}`)}
              />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

export default Areas;
