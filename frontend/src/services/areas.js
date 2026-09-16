import axios from 'axios';
const AREAS_URL = '/api/areas/';

export const buscarAreas = async () => {
    try {
        const response = await axios.get(
            AREAS_URL,
            {
                withCredentials: true,
            }
        );

        return response.data;
    } catch (erro) {
        console.error('Erro ao buscar áreas:', erro.response?.data);
        throw erro;
    }
};

export const buscarArea = async (id) => {
    if (!id) return null;

    try {
        const response = await axios.get(
            `${AREAS_URL}${id}/`,
            {
                withCredentials: true,
            }
        );

        return response.data;
    } catch (erro) {
        console.error('Erro ao buscar área:', erro.response?.data);
        throw erro;
    }
};

export const criarArea = async (dados) => {
    try {
        const response = await axios.post(
            AREAS_URL,
            dados,
            {
                withCredentials: true,
            }
        );

        return response.data;
    } catch (erro) {
        console.error('Erro ao criar área:', erro.response?.data);
        throw erro;
    }
};

export const atualizarArea = async (id, dados) => {
    if (!id) return null;

    try {
        const response = await axios.put(
            `${AREAS_URL}${id}/`,
            dados,
            {
                withCredentials: true,
            }
        );

        return response.data;
    } catch (erro) {
        console.error('Erro ao atualizar área:', erro.response?.data);
        throw erro;
    }
};

export const excluirArea = async (id) => {
    if (!id) return null;

    try {
        await axios.delete(
            `${AREAS_URL}${id}/`,
            {
                withCredentials: true,
            }
        );
    } catch (erro) {
        console.error('Erro ao excluir área:', erro.response?.data);
        throw erro;
    }
};
