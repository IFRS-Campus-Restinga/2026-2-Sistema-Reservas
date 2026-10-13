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
import {
  buscarUsuarioLogado,
  buscarAreas,
  buscarBlocos,
  buscarVeiculos,
  listarRecursosGerais,
  listarTiposRecurso,
} from '../services'
import styles from './MainLayout.module.css'

function MainLayout() {
  const [menuRecolhido, setMenuRecolhido] = useState(false)
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  const [reservaRapida, setReservaRapida] = useState(null)
  const [areas, setAreas] = useState([])
  const [blocos, setBlocos] = useState([])
  const [veiculos, setVeiculos] = useState([])
  const [recursos, setRecursos] = useState([])
  const [tiposRecurso, setTiposRecurso] = useState([])

  const location = useLocation()
  const navigate = useNavigate()

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

  async function abrirReservaEspaco() {
    try {
      const [listaAreas, listaBlocos] = await Promise.all([
        areas.length ? Promise.resolve(areas) : buscarAreas(),
        blocos.length ? Promise.resolve(blocos) : buscarBlocos(),
      ])

      setAreas(listaAreas)
      setBlocos(listaBlocos)
      setReservaRapida('area')
    } catch (erro) {
      console.error(erro)
      window.alert('Não foi possível carregar os espaços disponíveis.')
    }
  }

  async function abrirReservaVeiculo() {
    try {
      const listaVeiculos = veiculos.length
        ? veiculos
        : await buscarVeiculos()

      setVeiculos(listaVeiculos)
      setReservaRapida('veiculo')
    } catch (erro) {
      console.error(erro)
      window.alert('Não foi possível carregar os veículos disponíveis.')
    }
  }

  async function abrirReservaRecursoGeral() {
    try {
      const [listaRecursos, listaTipos] = await Promise.all([
        recursos.length ? Promise.resolve(recursos) : listarRecursosGerais(),
        tiposRecurso.length ? Promise.resolve(tiposRecurso) : listarTiposRecurso(),
      ])

      setRecursos(listaRecursos)
      setTiposRecurso(listaTipos)
      setReservaRapida('recurso')
    } catch (erro) {
      console.error(erro)
      window.alert('Não foi possível carregar os recursos disponíveis.')
    }
  }

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
        areas={areas}
        blocos={blocos}
        usuario={usuario}
        aoFechar={() => setReservaRapida(null)}
        aoReservar={() => reservaCriada('area')}
      />

      <ReservaVeiculoModal
        aberto={reservaRapida === 'veiculo'}
        veiculoInicial={null}
        veiculos={veiculos}
        aoFechar={() => setReservaRapida(null)}
        aoReservar={() => reservaCriada('veiculo')}
      />

      <ReservaRecursoGeralModal
        aberto={reservaRapida === 'recurso'}
        tipos={tiposRecurso}
        recursos={recursos}
        aoFechar={() => setReservaRapida(null)}
        aoReservar={() => reservaCriada('recurso_geral')}
      />
    </UsuarioContext>
  )
}

export default MainLayout
