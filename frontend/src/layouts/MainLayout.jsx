import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from '../components/SideBar/SideBar'
import Header from '../components/Header/Header'

function MainLayout() {
const [menuRecolhido, setMenuRecolhido] = useState(false)
const [paginaAtual, setPaginaAtual] = useState('Home')
  
  return (
    <div className="app">
      <Sidebar 
        menuRecolhido={menuRecolhido}
        recolherMenu={() => setMenuRecolhido((n) => !n)}
        paginaAtual={paginaAtual}
        trocarPagina={setPaginaAtual}
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