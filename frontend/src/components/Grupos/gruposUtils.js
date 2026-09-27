const ROTULO_RECURSO = {
    ESPACO: 'Espaços',
    VEICULO: 'Veículos',
};

export function rotuloRecurso(grupo, tiposRecurso) {
    if (grupo.tipo_recurso_autorizado === 'RECURSO_GERAL') {
        const tipo = tiposRecurso.find((t) => t.id === grupo.tipo_recurso);
        return tipo ? tipo.nome : 'Recurso geral';
    }
    return ROTULO_RECURSO[grupo.tipo_recurso_autorizado] || grupo.tipo_recurso_autorizado;
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
