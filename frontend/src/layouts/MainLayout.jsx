import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Sidebar from '../components/SideBar/SideBar'
import Header from '../components/Header/Header'
import ReservaAreaModal from '../components/ReservaArea/ReservaAreaModal'
import ReservaVeiculoModal from '../components/ReservaVeiculo/ReservaVeiculoModal'
import ReservaRecursoGeralModal from '../components/ReservaRecursoGeral/ReservaRecursoGeralModal'
import NaoAutenticado from '../pages/NaoAutenticado/NaoAutenticado'
import { ITENS_MENU } from '../config/rotas'
import { UsuarioContext } from '../contexts/UsuarioContext'
import { buscarUsuarioLogado } from '../services'
import styles from './MainLayout.module.css'

function MainLayout() {
  const [menuRecolhido, setMenuRecolhido] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  const [reservaRapida, setReservaRapida] = useState(null)

  const location = useLocation()
  const navigate = useNavigate()

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

  function abrirReservaEspaco() { setReservaRapida('area') }
  function abrirReservaVeiculo() { setReservaRapida('veiculo') }
  function abrirReservaRecursoGeral() { setReservaRapida('recurso') }

  function reservaCriada(tipo) {
    setReservaRapida(null)
    navigate('/minhas-reservas', {
      state: { criada: true, tipo },
    })
  }

  if (carregando) {
    return null
  }

  if (!usuario) {
    return <NaoAutenticado />
  }

  return (
    <UsuarioContext value={usuario}>
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
            aoReservarEspaco={abrirReservaEspaco}
            aoReservarVeiculo={abrirReservaVeiculo}
            aoReservarRecursoGeral={abrirReservaRecursoGeral}
          />

          <main className={styles.content}>
            <Outlet />
          </main>
        </div>
      </div>

      <ReservaAreaModal
        aberto={reservaRapida === 'area'}
        areaInicial={null}
        usuario={usuario}
        aoFechar={() => setReservaRapida(null)}
        aoReservar={() => reservaCriada('area')}
      />

      <ReservaVeiculoModal
        aberto={reservaRapida === 'veiculo'}
        veiculoInicial={null}
        aoFechar={() => setReservaRapida(null)}
        aoReservar={() => reservaCriada('veiculo')}
      />

      <ReservaRecursoGeralModal
        aberto={reservaRapida === 'recurso'}
        aoFechar={() => setReservaRapida(null)}
        aoReservar={() => reservaCriada('recurso_geral')}
      />
    </UsuarioContext>
  )
}

export default MainLayout
