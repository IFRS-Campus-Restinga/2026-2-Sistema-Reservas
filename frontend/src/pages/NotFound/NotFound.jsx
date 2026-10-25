import { SearchX } from "lucide-react";
import { Button, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import styles from "./NotFound.module.css";

function NotFound() {
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 p-4 bg-light">
      <Card className={`rounded-3 text-center ${styles.card}`}>
        <Card.Body className="d-flex flex-column align-items-center gap-3 p-4">
          <div
            className={`d-flex align-items-center justify-content-center rounded-circle ${styles.icone}`}
          >
            <SearchX size={24} />
          </div>

          <span className={`fw-bold ${styles.codigo}`}>404</span>
          <h1 className="fs-6 fw-semibold mb-0 text-dark">Página não encontrada</h1>
          <p className="small text-secondary mb-0">
            O endereço que você tentou acessar não existe ou foi movido.
          </p>

          <Button as={Link} to="/" className={`fw-semibold mt-2 ${styles.botao}`}>
            Voltar ao início
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
}

export default NotFound;
