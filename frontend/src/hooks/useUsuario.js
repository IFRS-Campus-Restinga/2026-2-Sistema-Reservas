import { useContext } from 'react'
import { UsuarioContext } from '../contexts/UsuarioContext'

export function useUsuario() {
  return useContext(UsuarioContext)
}
