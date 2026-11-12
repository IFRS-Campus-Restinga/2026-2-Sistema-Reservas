import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import MainLayout from '../layouts/MainLayout'
import CarregandoRota from '../components/CarregandoRota/CarregandoRota'
import ErrorBoundaryRota from '../components/CarregandoRota/ErrorBoundaryRota'
import RotaProtegida from './RotaProtegida'
import { ROTAS } from '../config/rotas'

const NotFound = lazy(() => import('../pages/NotFound/NotFound'))

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
        </Route>
        <Route
          path="*"
          element={
            <ErrorBoundaryRota>
              <Suspense fallback={<CarregandoRota />}>
                <NotFound />
              </Suspense>
            </ErrorBoundaryRota>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
