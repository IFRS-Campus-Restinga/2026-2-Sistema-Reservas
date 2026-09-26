import { FileWarning } from "lucide-react";
import { Card, Badge } from "react-bootstrap";
import { CATEGORIA_RECURSO_ICONE, CATEGORIA_RECURSO_LABEL, ICONE_CATEGORIA_PADRAO } from "../../utils/categoriaRecurso";
import { TIPO_PRAZO_LABEL } from "../../utils/tipoPrazo";
import styles from "./CardRecurso.module.css";

/**
 * Exemplo de uso:
 * <CardRecurso
 *   categoria="INFORMATICA"
 *   recursos={recursosDaCategoria}
 *   aoClicar={(recursosDaCategoria) => setRecursosSelecionados(recursosDaCategoria)}
 * />
 *
 * Props:
 * - categoria: valor do enum CategoriaRecurso (ver utils/categoriaRecurso.js) que identifica
 *   o grupo de recursos exibido no card
 * - recursos: lista de RecursoGeral pertencentes a essa categoria (já filtrada pelo componente pai)
 * - aoClicar: função chamada ao clicar no card. Não é chamada quando não há nenhum recurso disponível.
 */

function CardRecurso({ categoria, recursos, aoClicar }) {
  const IconeCategoria = CATEGORIA_RECURSO_ICONE[categoria] ?? ICONE_CATEGORIA_PADRAO;
  const rotuloCategoria = CATEGORIA_RECURSO_LABEL[categoria] ?? categoria;

  const totalDisponivel = recursos.reduce(
    (soma, recurso) => soma + Math.max(0, recurso.quantidade_total - recurso.quantidade_reservada),
    0,
  );
  const totalGeral = recursos.reduce((soma, recurso) => soma + recurso.quantidade_total, 0);
  const anyTermo = recursos.some((recurso) => recurso.tem_termo_de_responsabilidade);
  const desabilitado = totalDisponivel === 0;

  const prazos = [...new Set(recursos.map((recurso) => recurso.tipo_prazo))]
    .map((prazo) => TIPO_PRAZO_LABEL[prazo] ?? prazo)
    .join(" · ");

  return (
    <Card
      className={`rounded-3 ${styles.card} ${desabilitado ? styles.desabilitado : ""}`}
      onClick={() => aoClicar(recursos)}
    >
      <Card.Body className="p-3">
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div className={`d-flex align-items-center justify-content-center rounded-3 ${styles.iconeContainer}`}>
            <IconeCategoria size={22} />
          </div>
          {anyTermo && (
            <Badge pill bg="" className={`d-flex align-items-center gap-1 fw-semibold px-2 py-2 ${styles.badgeTermo}`}>
              <FileWarning size={11} /> Termo
            </Badge>
          )}
        </div>

        <Card.Title className={`fs-6 fw-bold ${styles.nome}`}>
          {rotuloCategoria}
        </Card.Title>
        <Card.Text className={`mt-1 mb-0 ${styles.subtitulo}`}>
          {prazos}
        </Card.Text>

        <div
          className={`d-flex align-items-center justify-content-between mt-3 pt-3 border-top border-light ${styles.rodape}`}
        >
          <span>{recursos.length} item(ns) cadastrado(s)</span>
          <span className={`fw-semibold ${totalDisponivel > 0 ? styles.disponivelPositivo : styles.disponivelZero}`}>
            {totalDisponivel}/{totalGeral} disponíveis
          </span>
        </div>
      </Card.Body>
    </Card>
  );
}

export default CardRecurso;
