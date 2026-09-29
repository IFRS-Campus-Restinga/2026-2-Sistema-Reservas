import { Car, Users } from "lucide-react";
import { Card, Badge } from "react-bootstrap";
import { STATUS_RECURSO_LABEL } from "../../utils/statusRecurso";
import styles from "./CardVeiculo.module.css";

/**
 * Exemplo de uso:
 * <CardVeiculo
 *   veiculo={veiculo}
 *   aoClicar={(veiculo) => setVeiculoSelecionado(veiculo)}
 * />
 *
 * Props:
 * - veiculo: objeto retornado pela API de Veiculos (nome, marca, modelo, placa, capacidade, status, ...)
 * - aoClicar: função chamada ao clicar no card do veiculo
 */

function CardVeiculo({ veiculo, aoClicar }) {
  const estaAtivo = veiculo.status === "ATIVO";
  const rotuloStatus = STATUS_RECURSO_LABEL[veiculo.status] ?? STATUS_RECURSO_LABEL.INATIVO;

  return (
    <Card 
      className={`rounded-3 ${styles.card}`} 
      onClick={() => aoClicar(veiculo)}
    >
      <Card.Body className="p-3">
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div
            className={`d-flex align-items-center justify-content-center rounded-3 ${styles.iconeContainer} ${
              estaAtivo ? styles.iconeAtivo : `bg-light ${styles.iconeInativo}`
            }`}
          >
            <Car size={18} />
          </div>
          <Badge pill bg="" className={`fw-semibold px-2 py-2 ${styles.badgeStatus}`} data-status={veiculo.status}>
            {rotuloStatus}
          </Badge>
        </div>

        <Card.Title className={`fs-6 fw-bold ${styles.nome}`}>
          {veiculo.nome}
        </Card.Title>
        <Card.Text className={`mt-1 mb-0 ${styles.subtitulo}`}>
          {veiculo.marca} {veiculo.modelo} · {veiculo.placa}
        </Card.Text>

        <div className={`d-flex align-items-center gap-1 mt-3 pt-3 border-top border-light ${styles.rodape}`}>
          <Users size={11} />
          <span>{veiculo.capacidade}</span>
        </div>
      </Card.Body>
    </Card>
  );
}

export default CardVeiculo;
