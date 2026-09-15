export async function buscarUsuarioLogado() {
  const resposta = await fetch('/session/me/', { credentials: 'include' })

  if (!resposta.ok) {
    throw new Error('Não foi possível carregar o usuário logado.')
  }

  return resposta.json()
}
