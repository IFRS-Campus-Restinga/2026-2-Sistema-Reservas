import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  FileText,
  Pencil,
  XCircle,
} from 'lucide-react';

import { ehAdministrador } from './permissoes';

const TIPOS_TERMO_ENVIADO = [
  'TERMO_ENVIADO',
  'TERMO_REENVIADO',
  'RETIRADA_ENVIADA',
  'RETIRADA_REENVIADA',
  'DEVOLUCAO_ENVIADA',
  'DEVOLUCAO_REENVIADA',
];

const TIPOS_TERMO_APROVADO = [
  'TERMO_APROVADO',
  'RETIRADA_APROVADA',
  'DEVOLUCAO_APROVADA',
];

const TIPOS_TERMO_REJEITADO = [
  'TERMO_REJEITADO',
  'RETIRADA_REJEITADA',
  'DEVOLUCAO_REJEITADA',
];

export const notificacaoTermoEnviado = (tipo) => TIPOS_TERMO_ENVIADO.includes(tipo);
export const notificacaoTermoRejeitado = (tipo) => TIPOS_TERMO_REJEITADO.includes(tipo);

export function configuracaoNotificacao(tipo) {
  if (
    tipo === 'CANCELAMENTO_RESERVA' ||
    tipo === 'REJEICAO_RESERVA' ||
    notificacaoTermoRejeitado(tipo)
  ) {
    return {
      Icone: XCircle,
      classe: 'iconeErro',
    };
  }

  if (
    tipo === 'CONFIRMACAO_RESERVA' ||
    TIPOS_TERMO_APROVADO.includes(tipo)
  ) {
    return {
      Icone: CheckCircle2,
      classe: 'iconeSucesso',
    };
  }

  if (notificacaoTermoEnviado(tipo)) {
    return {
      Icone: FileText,
      classe: 'iconeTermo',
    };
  }

  if (tipo === 'GRUPO_PROXIMO_VENCIMENTO') {
    return {
      Icone: AlertTriangle,
      classe: 'iconeTermo',
    };
  }

  if (tipo === 'ALTERACAO_RESERVA') {
    return {
      Icone: Pencil,
      classe: 'iconeInfo',
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
    notificacaoTermoEnviado(notificacao.tipo)
  );
}
