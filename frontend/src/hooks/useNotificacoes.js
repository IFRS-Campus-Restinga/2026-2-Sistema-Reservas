import { useContext } from 'react';

import {
  NotificacoesContext,
} from '../contexts/notificacoes-context';

export function useNotificacoes() {
  const contexto = useContext(NotificacoesContext);

  if (!contexto) {
    throw new Error(
      'useNotificacoes deve ser usado dentro de NotificacoesProvider.'
    );
  }

  return contexto;
}
