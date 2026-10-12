import styles from "./Header.module.css";
import { Bell, Plus, Box, Building2, Car, ChevronDown } from "lucide-react";
import { PAPEL_USUARIO_LABEL } from "../../utils/usuario";
import { useEffect, useRef, useState } from "react";

function iniciaisDoNome(nome) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join("");
}

function Header({
  titulo,
  usuario,
  aoReservarEspaco,
  aoReservarVeiculo,
  aoReservarRecursoGeral,
}) {
  const [menuReservaAberto, setMenuReservaAberto] = useState(false);
  const containerReservaRef = useRef(null);

  useEffect(() => {
    function fecharAoClicarFora(evento) {
      if (
        containerReservaRef.current &&
        !containerReservaRef.current.contains(evento.target)
      ) {
        setMenuReservaAberto(false);
      }
    }

    function fecharComEsc(evento) {
      if (evento.key === "Escape") {
        setMenuReservaAberto(false);
      }
    }

    document.addEventListener("mousedown", fecharAoClicarFora);
    document.addEventListener("keydown", fecharComEsc);

    return () => {
      document.removeEventListener("mousedown", fecharAoClicarFora);
      document.removeEventListener("keydown", fecharComEsc);
    };
  }, []);

  function escolherReserva(acao) {
    setMenuReservaAberto(false);
    acao?.();
  }

 return (
    <header className={styles.header}>
      <div className={styles.infoHeader}>
        <h2 className={styles.titulo}>{titulo}</h2>
        <p className={styles.subTitulo}> Campus Restinga, IFRS </p>
      </div>

      <div className={styles.acoes}>
        <div className={styles.relative} ref={containerReservaRef}>
          <button
            type="button"
            className={styles.botaNovaReserva}
            onClick={() => setMenuReservaAberto((aberto) => !aberto)}
            aria-expanded={menuReservaAberto}
            aria-haspopup="menu"
          >
            <Plus size={15} />
            <span>Nova reserva</span>
            <ChevronDown
              size={14}
              className={menuReservaAberto ? styles.setaAberta : ""}
            />
          </button>

          {menuReservaAberto && (
            <div className={styles.menuReserva} role="menu">
              <button
                type="button"
                className={styles.itemReserva}
                onClick={() => escolherReserva(aoReservarEspaco)}
                role="menuitem"
              >
                <Building2 size={16} />
                <span>Reservar espaço</span>
              </button>

              <button
                type="button"
                className={styles.itemReserva}
                onClick={() => escolherReserva(aoReservarVeiculo)}
                role="menuitem"
              >
                <Car size={16} />
                <span>Reservar veículo</span>
              </button>

              <button
                type="button"
                className={styles.itemReserva}
                onClick={() => escolherReserva(aoReservarRecursoGeral)}
                role="menuitem"
              >
                <Box size={16} />
                <span>Reservar recurso geral</span>
              </button>
            </div>
          )}
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
                  {PAPEL_USUARIO_LABEL[usuario.papel] ?? usuario.papel}
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
