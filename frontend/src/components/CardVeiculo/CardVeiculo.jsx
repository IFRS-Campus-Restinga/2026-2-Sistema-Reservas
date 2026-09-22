import { Car, Users } from "lucide-react";
import { Card, Badge } from "react-bootstrap";
import { STATUS_RECURSO_LABEL } from "../../utils/statusRecurso";
import styles from "./CardVeiculo.module.css";

/**
 * Exemplo de uso:
 * <CardVeiculo
 *   veiculo={veiculo}
 *   aoClicar={(veiculo) => setVeiculoSelecionado(veiculo)}
 *   disponivelAgora={true}
 * />
 *
 * Props:
 * - veiculo: objeto retornado pela API de Veiculos (nome, marca, modelo, placa, capacidade, status, ...)
 * - aoClicar: função chamada ao clicar no card do veiculo
 * - disponivelAgora (opcional, boolean): se o veículo está livre neste momento. O cálculo
 *   (normalmente a partir das reservas do veículo) é responsabilidade do componente pai.
 *   Quando não informado, a linha "Livre agora/Ocupado" não é exibida.
 */

function CardVeiculo({ veiculo, aoClicar, disponivelAgora }) {
  const estaAtivo = veiculo.status === "ATIVO";
  const rotuloStatus = STATUS_RECURSO_LABEL[veiculo.status] ?? STATUS_RECURSO_LABEL.INATIVO;
  const mostrarDisponibilidade = typeof disponivelAgora === "boolean";

  return (
    <Card className={styles.card} onClick={() => aoClicar(veiculo)}>
      <Card.Body className={styles.corpo}>
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div
            className={`${styles.iconeContainer} ${
              estaAtivo ? styles.iconeAtivo : styles.iconeInativo
            }`}
          >
            <Car size={18} />
          </div>
          <Badge pill bg="" className={styles.badgeStatus} data-status={veiculo.status}>
            {rotuloStatus}
          </Badge>
        </div>

        <Card.Title className={styles.nome}>{veiculo.nome}</Card.Title>
        <Card.Text className={styles.subtitulo}>
          {veiculo.marca} {veiculo.modelo} · {veiculo.placa}
        </Card.Text>

        <div className={`d-flex align-items-center gap-3 ${styles.rodape}`}>
          <div className="d-flex align-items-center gap-1">
            <Users size={11} />
            <span>{veiculo.capacidade}</span>
          </div>

          {mostrarDisponibilidade && (
            <span className={disponivelAgora ? styles.livreAgora : ""}>
              {disponivelAgora ? "Livre agora" : "Ocupado"}
            </span>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

export default CardVeiculo;
