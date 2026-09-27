import { BrowserRouter, Routes, Route } from 'react-router-dom'

import MainLayout from '../layouts/MainLayout'
import Home from '../pages/Home/Home'
import Recursos from '../pages/Recursos/Recursos'
import Administracao from '../pages/Administracao/Administracao'
import NotFound from '../pages/NotFound/NotFound'
import MinhasReservas from '../pages/MinhasReservas/MinhasReservas';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/recursos" element={<Recursos />} />
          <Route path="/minhas-reservas" element={<MinhasReservas />}/>
          <Route path="/admin" element={<Administracao />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes