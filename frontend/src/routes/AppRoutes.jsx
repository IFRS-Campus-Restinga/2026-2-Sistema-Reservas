import { BrowserRouter, Routes, Route } from 'react-router-dom'

import MainLayout from '../layouts/MainLayout'
import NotFound from '../pages/NotFound/NotFound'
import RotaProtegida from './RotaProtegida'
import { ROTAS } from '../config/rotas'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {ROTAS.map(({ id, path, componente: Componente, permissao }) => (
            <Route
              key={id}
              path={path}
              element={
                <RotaProtegida permissao={permissao}>
                  <Componente />
                </RotaProtegida>
              }
            />
          ))}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
