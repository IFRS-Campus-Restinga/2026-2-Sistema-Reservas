import { LockKeyhole } from "lucide-react";
import styles from "./NaoAutenticado.module.css";

const HUB_URL = "http://localhost:3000";

function NaoAutenticado() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icone}>
          <LockKeyhole size={24} />
        </div>

        <h1 className={styles.titulo}>Não autenticado</h1>
        <p className={styles.subtitulo}>
          Sua sessão expirou ou você ainda não entrou pelo HUB. Faça login
          e acesse o Reserva de Recursos pelo menu de sistemas.
        </p>

        <a className={styles.botao} href={HUB_URL}>
          Ir para o HUB
        </a>
      </div>
    </div>
  );
}

export default NaoAutenticado;
