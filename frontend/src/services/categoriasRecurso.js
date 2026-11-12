import axios from 'axios';

const CATEGORIAS_RECURSO_URL = '/api/categorias-recurso/';
const config = { withCredentials: true };

export const criarCategoriaRecurso = async (dados) => (await axios.post(CATEGORIAS_RECURSO_URL, dados, config)).data;

export const atualizarCategoriaRecurso = async (id, dados) => (await axios.put(`${CATEGORIAS_RECURSO_URL}${id}/`, dados, config)).data;

export const excluirCategoriaRecurso = async (id) => {
    await axios.delete(`${CATEGORIAS_RECURSO_URL}${id}/`, config);
};
