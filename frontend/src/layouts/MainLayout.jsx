import { Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from '../components/SideBar/SideBar'
import Header from '../components/Header/Header'
import { MENU } from '../config/menuItems'

function MainLayout() {
  const [menuRecolhido, setMenuRecolhido] = useState(false)
  
  const location = useLocation();
  const paginaAtual = MENU.find((item) => item.url === location.pathname)?.titulo || 'Página não encontrada';


  return (
    <div className="app">
      <Sidebar
        menuRecolhido={menuRecolhido}
        recolherMenu={() => setMenuRecolhido((n) => !n)}
        paginaAtual={paginaAtual}
      />

      <div className="main">
        <Header
          titulo={paginaAtual}
        />

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout