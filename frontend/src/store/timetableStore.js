import { create } from 'zustand';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const useTimetableStore = create((set, get) => ({
  timetableData: null,
  ultimaSincronizacao: null,
  isLoading: false,
  error: null,

  // Função para buscar e cachear a timetable
  fetchTimetable: async () => {
    // Revalida os dados ao abrir a tela, sem duplicar consultas em andamento.
    if (get().isLoading) return;

    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/timetable/', { params: { incluir_metadados: 1 } });
      set({ timetableData: response.data.grade, ultimaSincronizacao: response.data.ultima_sincronizacao, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.erro || error.message, isLoading: false });
    }
  },

  // Função para sincronizar a timetable via POST (restrito a Admin)
  syncTimetable: async () => {
    set({ isLoading: true, error: null });
    try {
      const postResponse = await api.post('/timetable/');
      set({ ultimaSincronizacao: postResponse.data.ultima_sincronizacao });
      const response = await api.get('/timetable/', { params: { incluir_metadados: 1 } });
      set({ timetableData: response.data.grade, ultimaSincronizacao: response.data.ultima_sincronizacao, isLoading: false });
      return postResponse.data;
    } catch (error) {
      const msg = error.response?.data?.erro || error.response?.data?.detail || error.message;
      set({ error: msg, isLoading: false });
      throw error;
    }
  },
}));
