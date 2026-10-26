import { Navigate } from 'react-router-dom'
import { usePermissao } from '../hooks/usePermissao'
import { useUsuario } from '../hooks/useUsuario'
import { rotaInicial } from '../config/rotas'

function RotaProtegida({ permissao, children }) {
  const usuario = useUsuario()
  const permitido = usePermissao(permissao)

  if (!permitido) {
    return <Navigate to={rotaInicial(usuario)} replace />
  }

  return children
}

export default RotaProtegida
