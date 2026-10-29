import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { listarTodosTiposRecurso } from '../../../services';
import { TIPO_RECURSO_RESERVAVEL, TIPO_RECURSO_RESERVAVEL_LABEL } from '../../../utils/tipoRecursoReservavel';
import Modal from '../../Administracao/Modal/Modal';
import styles from './GrupoModal.module.css';

const formularioInicial = {
    nome: '',
    tipo_membro_permitido: 'aluno',
    tipos_recurso_autorizados: [],
    tipos_recurso: [],
    data_inicio_validade: '',
    data_fim_validade: '',
};

const TIPOS_AUTORIZAVEIS_POR_MEMBRO = {
    aluno: [TIPO_RECURSO_RESERVAVEL.AREA, TIPO_RECURSO_RESERVAVEL.RECURSO_GERAL],
    servidor: [TIPO_RECURSO_RESERVAVEL.VEICULO],
};

function tiposIniciais(tipoMembro) {
    return tipoMembro === 'servidor' ? [TIPO_RECURSO_RESERVAVEL.VEICULO] : [];
}

function montarFormulario(grupo, tipoInicial) {
    if (!grupo) {
        return {
            ...formularioInicial,
            tipo_membro_permitido: tipoInicial,
            tipos_recurso_autorizados: tiposIniciais(tipoInicial),
        };
    }
    const tipoMembro = grupo.tipo_membro_permitido || 'aluno';
    const autorizaveis = TIPOS_AUTORIZAVEIS_POR_MEMBRO[tipoMembro] ?? [];
    return {
        nome: grupo.nome || '',
        tipo_membro_permitido: tipoMembro,
        tipos_recurso_autorizados: (grupo.tipos_recurso_autorizados ?? []).filter((tipo) => autorizaveis.includes(tipo)),
        tipos_recurso: (grupo.tipos_recurso ?? []).map(String),
        data_inicio_validade: grupo.data_inicio_validade || '',
        data_fim_validade: grupo.data_fim_validade || '',
    };
}

function GrupoModal({
    grupo,
    ehAdmin,
    tipoInicial = 'aluno',
    aoFechar,
    aoSalvar,
}) {
    const [formulario, setFormulario] = useState(() => montarFormulario(grupo, ehAdmin ? tipoInicial : 'aluno'));
    const [salvando, setSalvando] = useState(false);
    const [erros, setErros] = useState({});
    const [tiposRecurso, setTiposRecurso] = useState(null);
    const [recursosGeraisAbertos, setRecursosGeraisAbertos] = useState(false);

    useEffect(() => {
        listarTodosTiposRecurso()
            .then(setTiposRecurso)
            .catch(() => {
                setTiposRecurso([]);
                setErros((anteriores) => ({ ...anteriores, tipos_recurso: 'Não foi possível carregar os tipos de recurso.' }));
            });
    }, []);

    function alterarCampo(evento) {
        const { name, value } = evento.target;
        setFormulario((anterior) => ({
            ...anterior,
            [name]: value,
            ...(name === 'tipo_membro_permitido' ? {
                tipos_recurso_autorizados: tiposIniciais(value),
                tipos_recurso: [],
            } : {}),
        }));
        setErros((anteriores) => ({ ...anteriores, [name]: '', geral: '' }));
    }

    function alternarItem(evento) {
        const { name, value, checked } = evento.target;
        setFormulario((anterior) => ({
            ...anterior,
            [name]: checked
                ? [...anterior[name], value]
                : anterior[name].filter((item) => item !== value),
        }));
        setErros((anteriores) => ({ ...anteriores, [name]: '', geral: '' }));
    }

    function mostrarErro(evento) {
        const { name, validationMessage } = evento.target;
        setErros((anteriores) => ({ ...anteriores, [name]: validationMessage }));
    }

    function mensagemErro(campo) {
        return erros[campo] && (
            <p id={`erro-${campo}`} className={styles.erro} role="alert">
                {erros[campo]}
            </p>
        );
    }

    async function enviarFormulario(evento) {
        evento.preventDefault();

        const autorizaRecursoGeral = formulario.tipos_recurso_autorizados.includes(TIPO_RECURSO_RESERVAVEL.RECURSO_GERAL);

        if (formulario.tipos_recurso_autorizados.length === 0) {
            setErros({ tipos_recurso_autorizados: 'Selecione ao menos um recurso autorizado.' });
            return;
        }
        if (autorizaRecursoGeral && formulario.tipos_recurso.length === 0) {
            setErros({ tipos_recurso: 'Selecione ao menos um recurso geral.' });
            setRecursosGeraisAbertos(true);
            return;
        }

        try {
            setSalvando(true);
            setErros({});

            await aoSalvar({
                nome: formulario.nome,
                tipo_membro_permitido: formulario.tipo_membro_permitido,
                tipos_recurso_autorizados: formulario.tipos_recurso_autorizados,
                tipos_recurso: autorizaRecursoGeral ? formulario.tipos_recurso.map(Number) : [],
                data_inicio_validade: formulario.data_inicio_validade,
                data_fim_validade: formulario.data_fim_validade || null,
            });
        } catch (erro) {
            const errosApi = erro.response?.data;
            const novosErros = {};

            if (erro.response?.status === 400 && errosApi && typeof errosApi === 'object') {
                for (const [campo, mensagens] of Object.entries(errosApi)) {
                    const chave = Object.hasOwn(formularioInicial, campo) ? campo : 'geral';
                    novosErros[chave] = Array.isArray(mensagens)
                        ? mensagens.join(' ')
                        : String(mensagens);
                }
            }

            setErros(Object.keys(novosErros).length > 0
                ? novosErros
                : { geral: 'Não foi possível salvar o grupo. Tente novamente.' });
        } finally {
            setSalvando(false);
        }
    }

    const recursosGeraisSelecionados = (tiposRecurso ?? [])
        .filter((tipo) => formulario.tipos_recurso.includes(String(tipo.id)))
        .map((tipo) => tipo.descricao);
    const resumoRecursosGerais = tiposRecurso === null
        ? 'Carregando...'
        : recursosGeraisSelecionados.join(', ') || 'Nenhum selecionado';

    return (
        <Modal
            aberto
            titulo={grupo ? 'Editar grupo' : 'Novo grupo'}
            aoFechar={aoFechar}
            rodape={
                <>
                    <button type="button" className={styles.cancelar} onClick={aoFechar}>
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className={styles.salvar}
                        form="formulario-grupo"
                        disabled={salvando}
                    >
                        {salvando ? 'Salvando...' : 'Salvar'}
                    </button>
                </>
            }
        >
            <form
                id="formulario-grupo"
                className={styles.formulario}
                onSubmit={enviarFormulario}
                onInvalid={mostrarErro}
            >
                {mensagemErro('geral')}

                <div className={styles.campo}>
                    <label htmlFor="nome">Nome *</label>
                    <input
                        id="nome"
                        name="nome"
                        value={formulario.nome}
                        onChange={alterarCampo}
                        placeholder="Ex.: Monitoria de Cálculo I"
                        minLength={3}
                        maxLength={100}
                        aria-invalid={Boolean(erros.nome)}
                        aria-describedby="erro-nome"
                        required
                    />
                    {mensagemErro('nome')}
                </div>

                <div className={styles.campo}>
                    <label htmlFor="tipo_membro_permitido">Tipo de membro *</label>
                    {ehAdmin && !grupo ? (
                        <select
                            id="tipo_membro_permitido"
                            name="tipo_membro_permitido"
                            value={formulario.tipo_membro_permitido}
                            onChange={alterarCampo}
                            required
                        >
                            <option value="aluno">Alunos</option>
                            <option value="servidor">Servidores</option>
                        </select>
                    ) : (
                        <p className={styles.valorFixo}>
                            {formulario.tipo_membro_permitido === 'servidor' ? 'Servidores' : 'Alunos'}
                            {grupo && ' (não é possível alterar depois de criado)'}
                        </p>
                    )}
                    {mensagemErro('tipo_membro_permitido')}
                </div>

                {formulario.tipo_membro_permitido === 'servidor' ? (
                    <div className={styles.campo}>
                        <label>Recurso autorizado *</label>
                        <p className={styles.valorFixo}>{TIPO_RECURSO_RESERVAVEL_LABEL.VEICULO}</p>
                        {mensagemErro('tipos_recurso_autorizados')}
                    </div>
                ) : (
                    <fieldset className={styles.campo}>
                        <legend>Recursos autorizados *</legend>
                        <div className={styles.opcoes}>
                            {TIPOS_AUTORIZAVEIS_POR_MEMBRO.aluno.map((tipo) => (
                                <div key={tipo} className={styles.checkboxItem}>
                                    <input
                                        id={`tipo-${tipo}`}
                                        name="tipos_recurso_autorizados"
                                        type="checkbox"
                                        value={tipo}
                                        checked={formulario.tipos_recurso_autorizados.includes(tipo)}
                                        onChange={alternarItem}
                                    />
                                    <label htmlFor={`tipo-${tipo}`}>{TIPO_RECURSO_RESERVAVEL_LABEL[tipo]}</label>
                                </div>
                            ))}
                        </div>
                        {mensagemErro('tipos_recurso_autorizados')}
                    </fieldset>
                )}

                {formulario.tipos_recurso_autorizados.includes(TIPO_RECURSO_RESERVAVEL.RECURSO_GERAL) && (
                    <div className={styles.campo}>
                        <div className={styles.accordion}>
                            <button
                                type="button"
                                className={styles.accordionCabecalho}
                                aria-expanded={recursosGeraisAbertos}
                                aria-controls="lista-recursos-gerais"
                                data-invalido={Boolean(erros.tipos_recurso)}
                                onClick={() => setRecursosGeraisAbertos((aberto) => !aberto)}
                            >
                                <span className={styles.accordionTitulo}>Quais recursos gerais *</span>
                                <span className={styles.accordionResumo}>{resumoRecursosGerais}</span>
                                <ChevronDown size={16} className={styles.accordionIcone} aria-hidden="true" />
                            </button>
                            {recursosGeraisAbertos && tiposRecurso !== null && (
                                <div
                                    id="lista-recursos-gerais"
                                    role="group"
                                    aria-label="Quais recursos gerais"
                                    className={`${styles.opcoes} ${styles.accordionConteudo}`}
                                >
                                    {tiposRecurso.map((tipo) => (
                                        <div key={tipo.id} className={styles.checkboxItem}>
                                            <input
                                                id={`tipo-recurso-${tipo.id}`}
                                                name="tipos_recurso"
                                                type="checkbox"
                                                value={String(tipo.id)}
                                                checked={formulario.tipos_recurso.includes(String(tipo.id))}
                                                onChange={alternarItem}
                                            />
                                            <label htmlFor={`tipo-recurso-${tipo.id}`}>{tipo.descricao}</label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {mensagemErro('tipos_recurso')}
                    </div>
                )}

                <div className={styles.linhaDupla}>
                    <div className={styles.campo}>
                        <label htmlFor="data_inicio_validade">Válido a partir de *</label>
                        <input
                            id="data_inicio_validade"
                            name="data_inicio_validade"
                            type="date"
                            value={formulario.data_inicio_validade}
                            onChange={alterarCampo}
                            required
                        />
                        {mensagemErro('data_inicio_validade')}
                    </div>

                    <div className={styles.campo}>
                        <label htmlFor="data_fim_validade">Válido até (opcional)</label>
                        <input
                            id="data_fim_validade"
                            name="data_fim_validade"
                            type="date"
                            value={formulario.data_fim_validade}
                            onChange={alterarCampo}
                        />
                        {mensagemErro('data_fim_validade')}
                    </div>
                </div>
            </form>
        </Modal>
    );
}

export default GrupoModal;
