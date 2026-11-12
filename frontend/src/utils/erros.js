export function mensagemDeErro(falha, mensagemPadrao) {
  if (falha?.isAxiosError) return falha.response?.data?.detail || mensagemPadrao;
  if (falha instanceof TypeError) return mensagemPadrao;
  return falha?.message || mensagemPadrao;
}
