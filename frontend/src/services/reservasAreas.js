
const URL = '/api/reservas/areas/';

async function tratarResposta(resposta) {
  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    const primeiroErro = Object.values(dados).flat()[0];

    const mensagem = typeof primeiroErro === 'string'
      ? primeiroErro
      : 'Não foi possível concluir a operação.';

    const erro = new Error(dados.detail || mensagem);
    erro.dados = dados;

    throw erro;
  }

  return dados;
}

export async function listarReservasAreas({ dataInicio, dataFim } = {}) {
  const parametros = new URLSearchParams();

  if (dataInicio) parametros.set('data_inicio', dataInicio);
  if (dataFim) parametros.set('data_fim', dataFim);

  const consulta = parametros.size ? `?${parametros}` : '';

  const resposta = await fetch(`${URL}${consulta}`, {
    credentials: 'include',
  });

  return tratarResposta(resposta);
}

export async function listarMinhasReservasAreas() {
  const resposta = await fetch(`${URL}minhas/`, {
    credentials: 'include',
  });

  return tratarResposta(resposta);
}

export async function buscarAgendaArea(id) {
  const parametros = new URLSearchParams({ tipo: 'AREA', recurso: id });
  const resposta = await fetch(`/api/reservas/agenda/?${parametros}`, {
    credentials: 'include',
  });

  return tratarResposta(resposta);
}

export async function criarReservaArea(dados) {
  const resposta = await fetch(URL, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  });

  return tratarResposta(resposta);
}

export async function atualizarReservaArea(id, dados) {
  const resposta = await fetch(`${URL}${id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  });

  return tratarResposta(resposta);
}

export async function cancelarReservaArea(id) {
  const resposta = await fetch(`${URL}${id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'CANCELADA',
    }),
  });

  return tratarResposta(resposta);
}

export async function buscarRecorrenciaArea(id) {
  const resposta = await fetch(`${URL}recorrencias/${id}/`, {
    credentials: 'include',
  });

  return tratarResposta(resposta);
}

export async function atualizarRecorrenciaArea(id, dados) {
  const resposta = await fetch(`${URL}recorrencias/${id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  });

  return tratarResposta(resposta);
}

export async function cancelarRecorrenciaArea(id) {
  const resposta = await fetch(`${URL}recorrencias/${id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'CANCELADA',
    }),
  });

  return tratarResposta(resposta);
}
