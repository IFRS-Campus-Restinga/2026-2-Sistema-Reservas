import axios from 'axios';
const GRUPOS_URL = '/api/grupos/';

async function buscarTodasPaginas(url) {
    let proximaUrl = url;
    let resultados = [];

    while (proximaUrl) {
        const response = await axios.get(proximaUrl, { withCredentials: true });
        resultados = resultados.concat(response.data.results);
        proximaUrl = response.data.next;
    }

    return resultados;
}

export const buscarGrupos = async () => {
    try {
        return await buscarTodasPaginas(GRUPOS_URL);
    } catch (erro) {
        console.error('Erro ao buscar grupos:', erro.response?.data);
        throw erro;
    }
};

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

export const buscarMembros = async (grupoId) => {
    try {
        return await buscarTodasPaginas(`${GRUPOS_URL}${grupoId}/membros/?page_size=100`);
    } catch (erro) {
        console.error('Erro ao buscar membros:', erro.response?.data);
        throw erro;
    }
};

export const buscarCandidatos = async (grupoId, { pagina = 1, tamanhoPagina = 10, busca = '' } = {}) => {
    try {
        const response = await axios.get(
            `${GRUPOS_URL}${grupoId}/candidatos/`,
            {
                params: { page: pagina, page_size: tamanhoPagina, busca },
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
