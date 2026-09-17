import axios from 'axios';
const VEICULOS_URL = '/api/veiculos/';

export const buscarVeiculos = async () => {
    try {
        const response = await axios.get(
            VEICULOS_URL,
            {
                withCredentials: true,
            }
        );

        return response.data;
    } catch (erro) {
        console.error('Erro ao buscar veículos:', erro.response?.data);
        throw erro;
    }
};

export const buscarVeiculo = async (id) => {
    if (!id) return null;

    try {
        const response = await axios.get(
            `${VEICULOS_URL}${id}/`,
            {
                withCredentials: true,
            }
        );

        return response.data;
    } catch (erro) {
        console.error('Erro ao buscar veículo:', erro.response?.data);
        throw erro;
    }
};

export const criarVeiculo = async (dados) => {
    try {
        const response = await axios.post(
            VEICULOS_URL,
            dados,
            {
                withCredentials: true,
            }
        );

        return response.data;
    } catch (erro) {
        console.error('Erro ao criar veículo:', erro.response?.data);
        throw erro;
    }
};

export const atualizarVeiculo = async (id, dados) => {
    if (!id) return null;

    try {
        const response = await axios.put(
            `${VEICULOS_URL}${id}/`,
            dados,
            {
                withCredentials: true,
            }
        );

        return response.data;
    } catch (erro) {
        console.error('Erro ao atualizar veículo:', erro.response?.data);
        throw erro;
    }
};

export const excluirVeiculo = async (id) => {
    if (!id) return null;

    try {
        await axios.delete(
            `${VEICULOS_URL}${id}/`,
            {
                withCredentials: true,
            }
        );
    } catch (erro) {
        console.error('Erro ao excluir veículo:', erro.response?.data);
        throw erro;
    }
};
