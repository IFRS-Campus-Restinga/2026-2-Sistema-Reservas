import { Navigate } from 'react-router-dom'
import { usePermissao } from '../hooks/usePermissao'

function RotaProtegida({ permissao, children }) {
  const permitido = usePermissao(permissao)

  if (!permitido) {
    return <Navigate to="/" replace />
  }

  return children
}

export default RotaProtegida
