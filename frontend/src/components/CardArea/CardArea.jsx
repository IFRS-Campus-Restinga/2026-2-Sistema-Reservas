import { Users } from "lucide-react";
import { Card, Badge } from "react-bootstrap";
import { STATUS_RECURSO_LABEL } from "../../utils/statusRecurso";
import { ICONE_AREA_PADRAO, TIPO_AREA_ICONE, TIPO_AREA_LABEL } from "../../utils/tipoArea";
import styles from "./CardArea.module.css";

/**
 * Exemplo de uso:
 * <CardArea
 *   area={area}
 *   aoClicar={(area) => setAreaSelecionada(area)}
 *   blocoNome="Bloco A"
 * />
 *
 * Props:
 * - area: objeto retornado pela API de Áreas (nome, capacidade, status, tipo, ...)
 * - aoClicar: função chamada ao clicar no card da área
 * - blocoNome (opcional, string): nome do bloco já resolvido pelo componente pai, já que
 *   a API retorna apenas o id do bloco. Quando não informado, o subtítulo mostra só o tipo.
 */

function CardArea({ area, aoClicar, blocoNome }) {
  const estaAtiva = area.status === "ATIVO";
  const rotuloStatus = STATUS_RECURSO_LABEL[area.status] ?? STATUS_RECURSO_LABEL.INATIVO;
  const IconeTipo = TIPO_AREA_ICONE[area.tipo] ?? ICONE_AREA_PADRAO;

  const subtitulo = [TIPO_AREA_LABEL[area.tipo], blocoNome].filter(Boolean).join(" · ");

  return (
    <Card 
      className={`rounded-3 ${styles.card}`} 
      onClick={() => aoClicar(area)}
    >
      <Card.Body className="p-3">
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div
            className={`d-flex align-items-center justify-content-center rounded-3 ${styles.iconeContainer} ${
              estaAtiva ? styles.iconeAtivo : `bg-light ${styles.iconeInativo}`
            }`}
          >
            <IconeTipo size={18} />
          </div>
          <Badge pill bg="" className={`fw-semibold px-2 py-2 ${styles.badgeStatus}`} data-status={area.status}>
            {rotuloStatus}
          </Badge>
        </div>

        <Card.Title className={`fs-6 fw-bold ${styles.nome}`}>
          {area.nome}
        </Card.Title>
        <Card.Text className={`mt-1 mb-0 ${styles.subtitulo}`}>
          {subtitulo}
        </Card.Text>

        <div className={`d-flex align-items-center gap-1 mt-3 pt-3 border-top border-light ${styles.rodape}`}>
          <Users size={11} />
          <span>{area.capacidade}</span>
        </div>
      </Card.Body>
    </Card>
  );
}

export default CardArea;
