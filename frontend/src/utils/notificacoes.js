import {
  Bell,
  CheckCircle2,
  FileText,
  XCircle,
} from 'lucide-react';

import { ehAdministrador } from './permissoes';

export function configuracaoNotificacao(tipo) {
  if (
    tipo === 'CANCELAMENTO_RESERVA' ||
    tipo === 'REJEICAO_RESERVA' ||
    tipo === 'TERMO_REJEITADO'
  ) {
    return {
      Icone: XCircle,
      classe: 'iconeErro',
    };
  }

  if (
    tipo === 'CONFIRMACAO_RESERVA' ||
    tipo === 'TERMO_APROVADO'
  ) {
    return {
      Icone: CheckCircle2,
      classe: 'iconeSucesso',
    };
  }

  if (
    tipo === 'TERMO_ENVIADO' ||
    tipo === 'TERMO_REENVIADO'
  ) {
    return {
      Icone: FileText,
      classe: 'iconeTermo',
    };
  }

  return {
    Icone: Bell,
    classe: 'iconeInfo',
  };
}

export function notificacaoAbreSolicitacao(
  notificacao,
  usuario
) {
  return (
    ehAdministrador(usuario) &&
    (
      notificacao.tipo === 'TERMO_ENVIADO' ||
      notificacao.tipo === 'TERMO_REENVIADO'
    )
  );
}