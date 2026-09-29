import { BrowserRouter, Routes, Route } from 'react-router-dom'

import MainLayout from '../layouts/MainLayout'
import Home from '../pages/Home/Home'
import Recursos from '../pages/Recursos/Recursos'
import Administracao from '../pages/Administracao/Administracao'
import Grupos from '../pages/Grupos/Grupos'
import NotFound from '../pages/NotFound/NotFound'
import MinhasReservas from '../pages/MinhasReservas/MinhasReservas';
import Areas from  '../pages/Areas/Areas'
import AreaDetalhe from '../pages/AreaDetalhe/AreaDetalhe'
import Veiculos from '../pages/Veiculos/Veiculos'
import VeiculoDetalhe from '../pages/VeiculoDetalhe/VeiculoDetalhe'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/recursos" element={<Recursos />} />
          <Route path="/areas" element={<Areas />} />
          <Route path="/areas/:id" element={<AreaDetalhe />} />
          <Route path="/veiculos" element={<Veiculos />} />
          <Route path="/veiculos/:id" element={<VeiculoDetalhe />} />
          <Route path="/minhas-reservas" element={<MinhasReservas />}/>
          <Route path="/grupos" element={<Grupos />} />
          <Route path="/admin" element={<Administracao />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
