import { create } from 'zustand';
import axios from 'axios';

const api = axios.create({
  // Atualize isso depois caso a URL do Django mude no deploy
  baseURL: 'http://localhost:8000/api'
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
      set({ error: error.message, isLoading: false });
    }
  },
}));
