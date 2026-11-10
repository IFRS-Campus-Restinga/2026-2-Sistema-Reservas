import { create } from 'zustand';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const useTimetableStore = create((set, get) => {
  let versaoRequisicao = 0;
  let controleConsulta = null;
  let sincronizacao = null;

  return {
    timetableData: null,
    ultimaSincronizacao: null,
    isLoading: false,
    error: null,

    // Função para buscar e cachear a timetable
    fetchTimetable: async () => {
      // Revalida os dados ao abrir a tela, sem duplicar consultas em andamento.
      if (get().isLoading) return;

      const versao = ++versaoRequisicao;
      const controle = new AbortController();
      controleConsulta = controle;
      set({ isLoading: true, error: null });
      try {
        const response = await api.get('/timetable/', {
          params: { incluir_metadados: 1 }, signal: controle.signal,
        });
        if (versao !== versaoRequisicao) return;
        set({ timetableData: response.data.grade, ultimaSincronizacao: response.data.ultima_sincronizacao, isLoading: false });
      } catch (error) {
        if (versao !== versaoRequisicao || controle.signal.aborted) return;
        set({ error: error.response?.data?.erro || 'Não foi possível carregar a grade horária.', isLoading: false });
      } finally {
        if (controleConsulta === controle) controleConsulta = null;
      }
    },

    // Função para sincronizar a timetable via POST (restrito a Admin)
    syncTimetable: async () => {
      if (sincronizacao) return sincronizacao;
      ++versaoRequisicao;
      controleConsulta?.abort();
      controleConsulta = null;
      set({ isLoading: true, error: null });
      sincronizacao = (async () => {
        try {
          const postResponse = await api.post('/timetable/');
          set({ ultimaSincronizacao: postResponse.data.ultima_sincronizacao });
          const response = await api.get('/timetable/', { params: { incluir_metadados: 1 } });
          set({ timetableData: response.data.grade, ultimaSincronizacao: response.data.ultima_sincronizacao, isLoading: false });
          return postResponse.data;
        } catch (error) {
          const msg = error.response?.data?.erro || error.response?.data?.detail || 'Não foi possível sincronizar a grade horária.';
          set({ error: msg, isLoading: false });
          throw error;
        } finally {
          sincronizacao = null;
        }
      })();
      return sincronizacao;
    },
  };
});
