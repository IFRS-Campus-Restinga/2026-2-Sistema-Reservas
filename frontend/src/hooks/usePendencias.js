import { useEffect, useState } from 'react';
import { listarSolicitacoes } from '../services/termos';
import { ehAdministrador } from '../utils/permissoes';
import { EVENTO_PENDENCIAS_ATUALIZADAS } from '../utils/pendencias';

export function usePendencias(usuario) {
  const permitido = ehAdministrador(usuario);
  const [contagem, setContagem] = useState(null);

  useEffect(() => {
    if (!permitido) return;
    let controle;

    async function atualizar() {
      if (document.visibilityState === 'hidden') return;
      controle?.abort();
      const requisicao = new AbortController();
      controle = requisicao;
      try {
        // Os filtros da API são exclusivos: termos em análise não entram
        // nas reservas aguardando confirmação, evitando contagem duplicada.
        const resultados = await Promise.all(
          ['aguardando_confirmacao', 'termo_em_analise'].map((situacao) =>
            listarSolicitacoes({
              situacao, documento: 'todos', tipo: 'todos', page_size: 1,
            }, requisicao.signal)
          )
        );
        if (!requisicao.signal.aborted) {
          const total = resultados.reduce((soma, dados) => soma + dados.count, 0);
          setContagem({ usuario, total });
        }
      } catch {
        // Uma falha de consulta não significa que as pendências foram resolvidas.
      }
    }

    atualizar();
    const intervalo = window.setInterval(atualizar, 30000);
    window.addEventListener('focus', atualizar);
    document.addEventListener('visibilitychange', atualizar);
    window.addEventListener(EVENTO_PENDENCIAS_ATUALIZADAS, atualizar);
    return () => {
      controle?.abort();
      window.clearInterval(intervalo);
      window.removeEventListener('focus', atualizar);
      document.removeEventListener('visibilitychange', atualizar);
      window.removeEventListener(EVENTO_PENDENCIAS_ATUALIZADAS, atualizar);
    };
  }, [usuario, permitido]);

  return permitido && contagem?.usuario === usuario ? contagem.total : 0;
}
