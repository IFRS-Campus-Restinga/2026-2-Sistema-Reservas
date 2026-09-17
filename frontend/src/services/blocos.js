import axios from 'axios';
const BLOCOS_URL = '/api/blocos/';

export const buscarBlocos = async () => {
    try {
        const response = await axios.get(
            BLOCOS_URL,
            {
                withCredentials: true,
            }
        );

        return response.data;
    } catch (erro) {
        console.error('Erro ao buscar blocos:', erro.response?.data);
        throw erro;
    }
};

export const buscarBloco = async (id) => {
    if (!id) return null;

    try {
        const response = await axios.get(
            `${BLOCOS_URL}${id}/`,
            {
                withCredentials: true,
            }
        );

        return response.data;
    } catch (erro) {
        console.error('Erro ao buscar bloco:', erro.response?.data);
        throw erro;
    }
};

export const criarBloco = async (dados) => {
    try {
        const response = await axios.post(
            BLOCOS_URL,
            dados,
            {
                withCredentials: true,
            }
        );

        return response.data;
    } catch (erro) {
        console.error('Erro ao criar bloco:', erro.response?.data);
        throw erro;
    }
};

export const atualizarBloco = async (id, dados) => {
    if (!id) return null;

    try {
        const response = await axios.put(
            `${BLOCOS_URL}${id}/`,
            dados,
            {
                withCredentials: true,
            }
        );

        return response.data;
    } catch (erro) {
        console.error('Erro ao atualizar bloco:', erro.response?.data);
        throw erro;
    }
};

export const excluirBloco = async (id) => {
    if (!id) return null;

    try {
        await axios.delete(
            `${BLOCOS_URL}${id}/`,
            {
                withCredentials: true,
            }
        );
    } catch (erro) {
        console.error('Erro ao excluir bloco:', erro.response?.data);
        throw erro;
    }
};
