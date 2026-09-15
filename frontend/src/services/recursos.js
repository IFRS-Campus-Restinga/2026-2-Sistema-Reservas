async function tratarResposta(resposta) {
  if (resposta.status === 204) {
    return null
  }

  const dados = await resposta.json().catch(() => ({}))

  if (!resposta.ok) {
    const mensagem = dados.detail || 'Não foi possível concluir a operação.'
    const erro = new Error(mensagem)
    erro.dados = dados
    throw erro
  }

  return dados
}

export async function listarRecursosGerais() {
  const resposta = await fetch('/api/recursos-gerais/', {
    credentials: 'include',
  })

  return tratarResposta(resposta)
}

export async function criarRecursoGeral(recurso) {
  const resposta = await fetch('/api/recursos-gerais/', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(recurso),
  })

  return tratarResposta(resposta)
}

export async function atualizarRecursoGeral(id, recurso) {
  const resposta = await fetch(`/api/recursos-gerais/${id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(recurso),
  })

  return tratarResposta(resposta)
}

export async function excluirRecursoGeral(id) {
  const resposta = await fetch(`/api/recursos-gerais/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
  })

  return tratarResposta(resposta)
}

export async function listarTiposRecurso() {
  const resposta = await fetch('/api/tipos-recurso/', {
    credentials: 'include',
  })

  return tratarResposta(resposta)
}
