import styles from "./Header.module.css";
import { Bell, Plus } from "lucide-react";

const usuario = {
  nome: "Carlos Mendes",
  iniciais: "CM",
  perfil: "Administrador",
};

function Header({ titulo }) {
  return (
    <header className={styles.header}>
      <div className={styles.infoHeader}>
        <h2 className={styles.titulo}>{titulo}</h2>
        <p className={styles.subTitulo}> Campus Restinga, IFRS </p>
      </div>

      <div className={styles.acoes}>
        <div className={styles.relative}>
          <button type="button" className={styles.botaNovaReserva}>
            <Plus size={15} />
            <span>Nova reserva</span>
          </button>
        </div>

        <div className={styles.relative}>
          <button
            type="button"
            className={styles.botaoNotificacao}
            aria-label="Notificações"
          >
            <Bell size={18} />
          </button>
        </div>

        <div className={styles.containerPerfil}>
          <div className={styles.infoPerfil}>
            <div className={styles.dadosUsuario}>
              <p className={styles.nomeUsuario}>{usuario.nome}</p>
              <p className={styles.perfilUsuario}>{usuario.perfil}</p>
            </div>

            <div className={styles.avatar}>{usuario.iniciais}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
