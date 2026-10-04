import { temPermissao } from '../utils/permissoes'
import { useUsuario } from './useUsuario'

export function usePermissao(regra) {
  const usuario = useUsuario()
  return temPermissao(usuario, regra)
}
