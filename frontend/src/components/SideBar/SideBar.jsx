import { useNavigate  } from "react-router-dom";
import {
    ChevronLeft,
    ChevronRight,
    ExternalLink
} from "lucide-react";
import { ITENS_MENU } from "../../config/rotas";
import { useUsuario } from "../../hooks/useUsuario";
import { useNotificacoes } from "../../hooks/useNotificacoes";
import { temPermissao } from "../../utils/permissoes";
import Tooltip from "../Tooltip/Tooltip";
import styles from "./SideBar.module.css";
import { HUB_URL } from "../../config/hub"

export default function Sidebar({
    paginaAtual,
    menuRecolhido,
    recolherMenu
}) {
    const navigate = useNavigate();
    const usuario = useUsuario();
    const { naoLidas } = useNotificacoes();
    const itens = ITENS_MENU.filter((item) => temPermissao(usuario, item.permissao));

    return (
        <aside
            className={`${styles.sidebar} ${menuRecolhido ? styles.recolhido : styles.expandido
                }`}
        >
            <div
                className={`${styles.logo} ${menuRecolhido ? styles.logoRecolhido : styles.logoExpandido
                    }`}
            >
                <div className={styles.iconeLogo}>
                    <span>IF</span>
                </div>

                {!menuRecolhido && (
                    <div className={styles.textoLogo}>
                        <p>RESERVAS</p>
                        <span>Campus Restinga</span>
                    </div>
                )}
            </div>

            <nav className={styles.navegacao}>
                {!menuRecolhido && (
                    <p className={styles.tituloNavegacao}>
                        Menu Principal
                    </p>
                )}

                <div className={styles.itensNavegacao}>
                    {itens.map(({ id, path, menu: { titulo, icone: Icon } }) => {
                        const ativo = paginaAtual == titulo;
                        const quantidade = id === "notificacoes" ? naoLidas : 0;
                        const descricao = quantidade > 0
                            ? `${titulo}: ${quantidade} não lidas`
                            : titulo;

                        return (
                            <Tooltip
                                key={id}
                                texto={menuRecolhido || quantidade > 0 ? descricao : undefined}
                                posicao="right"
                            >
                                <button
                                    type="button"
                                    onClick={() => navigate(path)}
                                    aria-label={descricao}
                                    className={`${styles.item} ${menuRecolhido ? styles.itemRecolhido : ""
                                        } ${ativo ? styles.itemAtivo : ""}`}
                                >
                                    <span className={styles.iconeItem}>
                                        <Icon size={18} />

                                        {quantidade > 0 && (
                                            <span className={styles.contadorNotificacoes} aria-hidden="true">
                                            {quantidade > 9 ? "9+" : quantidade}
                                            </span>
                                        )}
                                    </span>

                                    {!menuRecolhido && (
                                        <span className={styles.tituloItem}>
                                            {titulo}
                                        </span>
                                    )}
                                </button>
                            </Tooltip>
                        );
                    })}
                </div>
            </nav>

            <div className={styles.footer}>
                <Tooltip
                    texto={menuRecolhido ? "Voltar ao HUB" : undefined}
                    posicao="right"
                >
                    <button
                        type="button"
                        onClick={() => window.location.href = HUB_URL}
                        aria-label="Voltar ao HUB"
                        className={`${styles.botaoFooter} ${styles.botaoSair
                            } ${menuRecolhido ? styles.botaoFooterRecolhido : ""}`}
                    >
                        <ExternalLink size={16} />

                        {!menuRecolhido && (
                            <span>Voltar ao HUB</span>
                        )}
                    </button>
                </Tooltip>

                <Tooltip
                    texto={menuRecolhido ? "Expandir menu lateral" : "Recolher menu lateral"}
                    posicao="right"
                >
                    <button
                        type="button"
                        onClick={recolherMenu}
                        aria-label={menuRecolhido ? "Expandir menu lateral" : "Recolher menu lateral"}
                        className={`${styles.botaoFooter} ${styles.botaoRecolher
                            } ${menuRecolhido ? styles.botaoFooterRecolhido : ""}`}
                    >
                        {menuRecolhido ? (
                            <ChevronRight size={14} />
                        ) : (
                            <>
                                <ChevronLeft size={14} />
                                <span>Recolher</span>
                            </>
                        )}
                    </button>
                </Tooltip>
            </div>
        </aside>
    );
}
