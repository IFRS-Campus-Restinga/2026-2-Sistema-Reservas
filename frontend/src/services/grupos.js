import { consultarPagina } from './paginacao';
import axios from 'axios';
const GRUPOS_URL = '/api/grupos/';

export const buscarGrupos = (parametros, signal) => consultarPagina(GRUPOS_URL, parametros, signal);

export const criarGrupo = async (dados) => {
    try {
        const response = await axios.post(
            GRUPOS_URL,
            dados,
            { withCredentials: true }
        );

        return response.data;
    } catch (erro) {
        console.error('Erro ao criar grupo:', erro.response?.data);
        throw erro;
    }
};

export const atualizarGrupo = async (id, dados) => {
    if (!id) return null;

    try {
        const response = await axios.patch(
            `${GRUPOS_URL}${id}/`,
            dados,
            { withCredentials: true }
        );

        return response.data;
    } catch (erro) {
        console.error('Erro ao atualizar grupo:', erro.response?.data);
        throw erro;
    }
};

export const excluirGrupo = async (id) => {
    if (!id) return null;

    try {
        await axios.delete(
            `${GRUPOS_URL}${id}/`,
            { withCredentials: true }
        );
    } catch (erro) {
        console.error('Erro ao excluir grupo:', erro.response?.data);
        throw erro;
    }
};

export const buscarMembros = (grupoId, parametros, signal) => consultarPagina(`${GRUPOS_URL}${grupoId}/membros/`, parametros, signal);

export const buscarCandidatos = async (grupoId, { limite = 10, busca = '', excluir = [] } = {}) => {
    try {
        const response = await axios.get(
            `${GRUPOS_URL}${grupoId}/candidatos/`,
            {
                params: { limite, busca, excluir: excluir.join(',') },
                withCredentials: true,
            }
        );

        return response.data;
    } catch (erro) {
        console.error('Erro ao buscar candidatos:', erro.response?.data);
        throw erro;
    }
};

export const adicionarMembros = async (grupoId, membros) => {
    try {
        const response = await axios.post(
            `${GRUPOS_URL}${grupoId}/membros/`,
            membros,
            { withCredentials: true }
        );

        return response.data;
    } catch (erro) {
        console.error('Erro ao adicionar membros:', erro.response?.data);
        throw erro;
    }
};

export const atualizarMembro = async (grupoId, membroId, dados) => {
    try {
        const response = await axios.patch(
            `${GRUPOS_URL}${grupoId}/membros/${membroId}/`,
            dados,
            { withCredentials: true }
        );

        return response.data;
    } catch (erro) {
        console.error('Erro ao atualizar membro:', erro.response?.data);
        throw erro;
    }
};

export const removerMembro = async (grupoId, membroId) => {
    try {
        await axios.delete(
            `${GRUPOS_URL}${grupoId}/membros/${membroId}/`,
            { withCredentials: true }
        );
    } catch (erro) {
        console.error('Erro ao remover membro:', erro.response?.data);
        throw erro;
    }
};
