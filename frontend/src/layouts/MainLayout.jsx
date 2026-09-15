import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Sidebar from '../components/SideBar/SideBar'
import Header from '../components/Header/Header'
import { MENU } from '../config/menuItems'
import { buscarUsuarioLogado } from '../services'
import styles from './MainLayout.module.css'

function MainLayout() {
  const [menuRecolhido, setMenuRecolhido] = useState(false)
  const [usuario, setUsuario] = useState(null)

  const location = useLocation();
  const paginaAtual = MENU.find((item) => item.url === location.pathname)?.titulo || 'Página não encontrada';

  useEffect(() => {
    buscarUsuarioLogado()
      .then(setUsuario)
      .catch(() => setUsuario(null))
  }, [])

  return (
    <div className={styles.app}>
      <Sidebar
        menuRecolhido={menuRecolhido}
        recolherMenu={() => setMenuRecolhido((n) => !n)}
        paginaAtual={paginaAtual}
      />

      <div className={styles.main}>
        <Header
          titulo={paginaAtual}
          usuario={usuario}
        />

        <main className={styles.content}>
          <Outlet context={{ usuario }} />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
