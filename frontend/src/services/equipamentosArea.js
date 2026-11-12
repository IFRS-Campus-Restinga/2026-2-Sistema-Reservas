import axios from 'axios';

const EQUIPAMENTOS_AREA_URL = '/api/equipamentos-area/';
const config = { withCredentials: true };

export const criarEquipamentoArea = async (dados) => (await axios.post(EQUIPAMENTOS_AREA_URL, dados, config)).data;

export const atualizarEquipamentoArea = async (id, dados) => (await axios.put(`${EQUIPAMENTOS_AREA_URL}${id}/`, dados, config)).data;

export const excluirEquipamentoArea = async (id) => {
    await axios.delete(`${EQUIPAMENTOS_AREA_URL}${id}/`, config);
};
