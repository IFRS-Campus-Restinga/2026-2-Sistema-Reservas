import { useNavigate  } from "react-router-dom";
import {
    LogOut,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { MENU } from "../../config/menuItems";
import styles from "./SideBar.module.css";

export default function Sidebar({
    paginaAtual,
    menuRecolhido,
    recolherMenu
}) {
    const navigate = useNavigate();
    const itens = MENU.filter((item) => item.permissoes == true);

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
                    {itens.map(({ id, titulo, icone: Icon, url }) => {
                        const ativo = paginaAtual == titulo;

                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => navigate(url)}
                                title={menuRecolhido ? titulo : undefined}
                                className={`${styles.item} ${menuRecolhido ? styles.itemRecolhido : ""
                                    } ${ativo ? styles.itemAtivo : ""}`}
                            >
                                <span className={styles.iconeItem}>
                                    <Icon size={18} />
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
                    title={menuRecolhido ? "Sair" : undefined}
                    className={`${styles.botaoFooter} ${styles.botaoSair
                        } ${menuRecolhido ? styles.botaoFooterRecolhido : ""}`}
                >
                    <LogOut size={16} />

                    {!menuRecolhido && (
                        <span>Sair do Sistema</span>
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