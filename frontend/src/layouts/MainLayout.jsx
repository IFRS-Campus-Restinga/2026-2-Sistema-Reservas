import { matchPath, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Sidebar from '../components/SideBar/SideBar'
import Header from '../components/Header/Header'
import NaoAutenticado from '../pages/NaoAutenticado/NaoAutenticado'
import { ITENS_MENU, ROTAS } from '../config/rotas'
import { UsuarioContext } from '../contexts/UsuarioContext'
import { NotificacoesProvider } from '../contexts/NotificacoesContext'
import { buscarUsuarioLogado } from '../services'
import styles from './MainLayout.module.css'

function MainLayout() {
  const [menuRecolhido, setMenuRecolhido] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  const location = useLocation()

  useEffect(() => {
    const telaPequena = window.matchMedia('(max-width: 767px)')
    function adaptarMenu(evento) {
      setMenuRecolhido(evento.matches)
    }
    telaPequena.addEventListener('change', adaptarMenu)
    return () => telaPequena.removeEventListener('change', adaptarMenu)
  }, [])
  const paginaAtual = ITENS_MENU.find((item) =>
    item.path === location.pathname ||
    (item.path !== '/' && location.pathname.startsWith(`${item.path}/`))
  )?.menu.titulo || 'Página não encontrada'

  useEffect(() => {
    buscarUsuarioLogado()
      .then(setUsuario)
      .catch(() => setUsuario(null))
      .finally(() => setCarregando(false))
  }, [])

  if (carregando) {
    return null
  }

  // Visitante só acessa rotas públicas; a "/" redireciona para o calendário (RotaProtegida).
  const rotaPublica = location.pathname === '/' ||
    ROTAS.some((rota) => rota.publica && matchPath(rota.path, location.pathname))

  if (!usuario && !rotaPublica) {
    return <NaoAutenticado />
  }

  return (
    <UsuarioContext value={usuario}>
      <NotificacoesProvider usuario={usuario}>
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
              <Outlet />
            </main>
          </div>
        </div>
      </NotificacoesProvider>
    </UsuarioContext>
  )
}

export default MainLayout
