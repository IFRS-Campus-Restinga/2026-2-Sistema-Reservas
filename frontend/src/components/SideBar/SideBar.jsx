import {
    LogOut,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { MENUS } from "../../config/menuItems";
import styles from "./SideBar.module.css";

export default function Sidebar({
    currentPage,
    collapsed,
    onToggle,
    unreadCount,
}) {
    const items = MENUS.filter((item) => item.permissoes == true);

    return (
        <aside
            className={`${styles.sidebar} ${collapsed ? styles.collapsed : styles.expanded
                }`}
        >
            {/* Logo */}
            <div
                className={`${styles.logo} ${collapsed ? styles.logoCollapsed : styles.logoExpanded
                    }`}
            >
                <div className={styles.logoIcon}>
                    <span>IF</span>
                </div>

                {!collapsed && (
                    <div className={styles.logoText}>
                        <p>RESERVAS</p>
                        <span>Campus Restinga</span>
                    </div>
                )}
            </div>

            {/* Navegação */}
            <nav className={styles.navigation}>
                {!collapsed && (
                    <p className={styles.navigationTitle}>
                        Menu Principal
                    </p>
                )}

                <div className={styles.navigationItems}>
                    {items.map(({ id, titulo, icone: Icon, url }) => {
                        const active = currentPage === id;

                        return (
                            <Link key={id} to={url} style={{textDecoration: 'none'}}>
                                <button
                                    type="button"
                                    title={collapsed ? titulo : undefined}
                                    className={`${styles.navItem} ${collapsed ? styles.navItemCollapsed : ""
                                        } ${active ? styles.navItemActive : ""}`}
                                >
                                    <span className={styles.navIcon}>
                                        <Icon size={18} />

                                        {id === "notificações" && unreadCount > 0 && (
                                            <span className={styles.notificationBadge}>
                                                {unreadCount}
                                            </span>
                                        )}
                                    </span>

                                    {!collapsed && (
                                        <span className={styles.navLabel}>
                                            {titulo}
                                        </span>
                                    )}
                                </button>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Rodapé */}
            <div className={styles.footer}>
                <button
                    type="button"
                    title={collapsed ? "Sair" : undefined}
                    className={`${styles.footerButton} ${styles.logoutButton
                        } ${collapsed ? styles.footerButtonCollapsed : ""}`}
                >
                    <LogOut size={16} />

                    {!collapsed && (
                        <span>Sair do Sistema</span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={onToggle}
                    className={`${styles.footerButton} ${styles.toggleButton
                        } ${collapsed ? styles.footerButtonCollapsed : ""}`}
                >
                    {collapsed ? (
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