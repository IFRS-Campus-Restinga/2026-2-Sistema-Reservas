import styles from "./Header.module.css";
import { Bell, Plus } from "lucide-react";

const PAPEL_LABEL = {
  admin: "Administrador",
  servidor: "Servidor",
  aluno: "Aluno",
  convidado: "Convidado",
};

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

        {usuario && (
          <div className={styles.containerPerfil}>
            <div className={styles.infoPerfil}>
              <div className={styles.dadosUsuario}>
                <p className={styles.nomeUsuario}>{usuario.nome}</p>
                <p className={styles.perfilUsuario}>
                  {PAPEL_LABEL[usuario.papel] ?? usuario.papel}
                </p>
              </div>

              <div className={styles.avatar}>{iniciaisDoNome(usuario.nome)}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
