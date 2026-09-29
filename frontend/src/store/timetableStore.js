import { create } from 'zustand';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const useTimetableStore = create((set, get) => ({
  timetableData: null,
  isLoading: false,
  error: null,

  // Função para buscar e cachear a timetable
  fetchTimetable: async () => {
    // Previne requisição duplicada caso os dados já estejam cacheados
    if (get().timetableData) return;

    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/timetable/');
      set({ timetableData: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.erro || error.message, isLoading: false });
    }
  },

  // Função para sincronizar a timetable via POST (restrito a Admin)
  syncTimetable: async () => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/timetable/');
      const response = await api.get('/timetable/');
      set({ timetableData: response.data, isLoading: false });
    } catch (error) {
      const msg = error.response?.data?.erro || error.response?.data?.detail || error.message;
      set({ error: msg, isLoading: false });
      throw error;
    }
  },
}));
