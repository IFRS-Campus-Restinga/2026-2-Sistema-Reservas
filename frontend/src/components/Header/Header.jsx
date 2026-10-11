import { Button } from "react-bootstrap";
import { Bell } from "lucide-react";
import NovaReserva from "./NovaReserva/NovaReserva";
import { PAPEL_USUARIO_LABEL } from "../../utils/usuario";
import styles from "./Header.module.css";

function iniciaisDoNome(nome) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join("");
}

function Header({ titulo, usuario }) {
  return (
    <header
      className={`d-flex align-items-center justify-content-between gap-2 flex-shrink-0 bg-white border-bottom px-3 px-md-4 ${styles.header}`}
    >
      <div className={styles.titulos}>
        <h2 className="h5 m-0 fw-semibold text-truncate">{titulo}</h2>
        <p className="d-none d-sm-block m-0 small text-muted">
          Campus Restinga, IFRS
        </p>
      </div>

      <div className="d-flex align-items-center gap-2 flex-shrink-0">
        {usuario && <NovaReserva usuario={usuario} />}

        <Button
          variant="light"
          className={`d-flex p-2 border-0 rounded-3 text-secondary ${styles.botaoNotificacao}`}
          aria-label="Notificações"
        >
          <Bell size={18} />
        </Button>

        {usuario && (
          <div className="d-flex align-items-center gap-2 ps-2 border-start">
            <div className="d-none d-md-block text-end lh-sm">
              <p className="m-0 small fw-semibold text-capitalize">
                {usuario.nome}
              </p>
              <p className={`m-0 small ${styles.perfilUsuario}`}>
                {PAPEL_USUARIO_LABEL[usuario.papel] ?? usuario.papel}
              </p>
            </div>

            <div
              className={`d-flex align-items-center justify-content-center rounded-circle text-white fw-bold small ${styles.avatar}`}
            >
              {iniciaisDoNome(usuario.nome)}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
