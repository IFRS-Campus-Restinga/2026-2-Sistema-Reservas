import axios from 'axios';

const AUDITORIA_URL = '/api/auditoria/';

function montarParametros(filtros, pagina) {
    return Object.fromEntries(
        Object.entries({ ...filtros, page: pagina })
            .filter(([, valor]) => valor !== '' && valor !== null && valor !== undefined)
    );
}

export const buscarLogsAuditoria = async (filtros = {}, pagina = 1) => {
    try {
        const response = await axios.get(AUDITORIA_URL, {
            params: montarParametros(filtros, pagina),
            withCredentials: true,
        });

        return response.data;
    } catch (erro) {
        console.error('Erro ao buscar logs de auditoria:', erro.response?.data);
        throw erro;
    }
};

export const buscarLogAuditoria = async (id) => {
    try {
        const response = await axios.get(`${AUDITORIA_URL}${id}/`, { withCredentials: true });

        return response.data;
    } catch (erro) {
        console.error('Erro ao buscar log de auditoria:', erro.response?.data);
        throw erro;
    }
};
