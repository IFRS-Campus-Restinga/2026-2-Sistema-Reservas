import { useNavigate  } from "react-router-dom";
import {
    LogOut,
    ChevronLeft,
    ChevronRight,
    ExternalLink
} from "lucide-react";
import { useEffect, useState } from "react";
import { ITENS_MENU } from "../../config/rotas";
import { useUsuario } from "../../hooks/useUsuario";
import { temPermissao } from "../../utils/permissoes";
import styles from "./SideBar.module.css";
import { listarNotificacoes } from "../../services";
import { HUB_URL } from "../../config/hub"

export default function Sidebar({
    paginaAtual,
    menuRecolhido,
    recolherMenu
}) {
    const navigate = useNavigate();
    const usuario = useUsuario();
    const itens = ITENS_MENU.filter((item) => temPermissao(usuario, item.permissao));
    const [naoLidas, setNaoLidas] = useState(0);
    useEffect(() => {
    let ativo = true;

    async function carregarContador() {
        try {
        const dados = await listarNotificacoes();

        if (ativo) {
            setNaoLidas(dados.nao_lidas || 0);
        }
        } catch {
        if (ativo) {
            setNaoLidas(0);
        }
        }
    }

    carregarContador();

    window.addEventListener(
        "notificacoes-atualizadas",
        carregarContador
    );

    return () => {
        ativo = false;

        window.removeEventListener(
        "notificacoes-atualizadas",
        carregarContador
        );
    };
    }, [usuario?.id]);

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

                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => navigate(path)}
                                title={menuRecolhido ? titulo : undefined}
                                className={`${styles.item} ${menuRecolhido ? styles.itemRecolhido : ""
                                    } ${ativo ? styles.itemAtivo : ""}`}
                            >
                                <span className={styles.iconeItem}>
                                    <Icon size={18} />

                                    {id === "notificacoes" && naoLidas > 0 && (
                                        <span className={styles.contadorNotificacoes}>
                                        {naoLidas > 9 ? "9+" : naoLidas}
                                        </span>
                                    )}
                                </span>

                                {!menuRecolhido && (
                                    <span className={styles.tituloItem}>
                                        {titulo}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>

            <div className={styles.footer}>
                <button
                    type="button"
                    onClick={() => window.location.href = HUB_URL}
                    title={menuRecolhido ? "Voltar ao HUB" : undefined}
                    className={`${styles.botaoFooter} ${styles.botaoSair
                        } ${menuRecolhido ? styles.botaoFooterRecolhido : ""}`}
                >
                    <ExternalLink size={16} />

                    {!menuRecolhido && (
                        <span>Voltar ao HUB</span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={recolherMenu}
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
            </div>
        </aside>
    );
}