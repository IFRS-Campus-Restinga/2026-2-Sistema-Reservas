import useListaPaginada from '../../hooks/useListaPaginada';
import Paginacao from '../../components/Administracao/Paginacao/Paginacao';
import SelectRemoto from '../../components/SelectRemoto/SelectRemoto';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col } from "react-bootstrap";
import { Search } from "lucide-react";
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


  const [busca, setBusca] = useState("");
  const [filtroBloco, setFiltroBloco] = useState("todos");
  const [filtroCapacidade, setFiltroCapacidade] = useState("0");

  const { itens: areasFiltradas, carregando, erro, paginacao } = useListaPaginada('/api/areas/', { busca, bloco: filtroBloco, capacidade: filtroCapacidade });

  return (
    <div className="d-flex flex-column gap-4 p-3 p-md-4">
      <div className="d-flex flex-wrap align-items-center justify-content-center gap-2">
        <CampoBusca valor={busca} aoAlterar={setBusca} placeholder="Buscar área" />

        <SelectRemoto url="/api/blocos/"
          valor={filtroBloco}
          aoAlterar={setFiltroBloco}
          filtros={{ page_size: 100 }}
          mostrarBusca={false}
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
                blocoNome={area.bloco_nome}
                aoClicar={(area) => navigate(`/areas/${area.id}`)}
              />
            </Col>
          ))}
        </Row>
      )}
      <Paginacao {...paginacao} />
    </div>
  );
}

export default Areas;
