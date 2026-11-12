import axios from 'axios';

const TIPOS_RECURSO_URL = '/api/tipos-recurso/';
const config = { withCredentials: true };

export const criarTipoRecurso = async (dados) => (await axios.post(TIPOS_RECURSO_URL, dados, config)).data;

export const atualizarTipoRecurso = async (id, dados) => (await axios.put(`${TIPOS_RECURSO_URL}${id}/`, dados, config)).data;

export const excluirTipoRecurso = async (id) => {
    await axios.delete(`${TIPOS_RECURSO_URL}${id}/`, config);
};
