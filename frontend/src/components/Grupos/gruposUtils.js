import { TIPO_RECURSO_RESERVAVEL } from '../../utils/tipoRecursoReservavel';

export const FILTRO_TODOS = 'todos';

const ROTULO_RECURSO = {
    AREA: 'Áreas',
    VEICULO: 'Veículos',
};

export function rotuloRecurso(grupo) {
    if (grupo.tipo_recurso_autorizado === 'RECURSO_GERAL') {
        return grupo.tipo_recurso_descricao || 'Recurso geral';
    }
    return ROTULO_RECURSO[grupo.tipo_recurso_autorizado] || grupo.tipo_recurso_autorizado;
}

export function correspondeAoFiltroRecurso(grupo, filtroRecurso, filtroTipoRecurso) {
    if (filtroRecurso === FILTRO_TODOS) return true;
    if (grupo.tipo_recurso_autorizado !== filtroRecurso) return false;
    if (filtroRecurso !== TIPO_RECURSO_RESERVAVEL.RECURSO_GERAL || filtroTipoRecurso === FILTRO_TODOS) return true;
    return String(grupo.tipo_recurso) === String(filtroTipoRecurso);
}

export function formatarData(dataISO) {
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

export function formatarValidadeMembro(membro, grupo) {
    const validade = membro.data_fim_validade || grupo.data_fim_validade;
    return validade ? `Ativo até ${formatarData(validade)}` : 'Ativo sem prazo definido';
}

export function extrairMensagemErro(erro, mensagemPadrao) {
    const errosApi = erro.response?.data;
    if (errosApi && typeof errosApi === 'object') {
        return Object.values(errosApi).flat().join(' ');
    }
    return mensagemPadrao;
}
