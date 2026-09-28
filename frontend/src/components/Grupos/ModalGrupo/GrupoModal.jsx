import { useEffect, useState } from 'react';
import { listarTiposRecurso } from '../../../services';
import Modal from '../../Administracao/Modal/Modal';
import styles from './GrupoModal.module.css';

const formularioInicial = {
    nome: '',
    tipo_membro_permitido: 'aluno',
    tipo_recurso_autorizado: 'AREA',
    tipo_recurso: '',
    data_inicio_validade: '',
    data_fim_validade: '',
};

function montarFormulario(grupo, tipoInicial) {
    if (!grupo) {
        return { ...formularioInicial, tipo_membro_permitido: tipoInicial };
    }
    return {
        nome: grupo.nome || '',
        tipo_membro_permitido: grupo.tipo_membro_permitido || 'aluno',
        tipo_recurso_autorizado: grupo.tipo_recurso_autorizado || 'AREA',
        tipo_recurso: grupo.tipo_recurso?.id ?? grupo.tipo_recurso ?? '',
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

    useEffect(() => {
        listarTiposRecurso()
            .then(setTiposRecurso)
            .catch(() => {
                setTiposRecurso([]);
                setErros((anteriores) => ({ ...anteriores, tipo_recurso: 'Não foi possível carregar os tipos de recurso.' }));
            });
    }, []);

    function alterarCampo(evento) {
        const { name, value } = evento.target;
        setFormulario((anterior) => ({ ...anterior, [name]: value }));
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

        const ehRecursoGeral = formulario.tipo_recurso_autorizado === 'RECURSO_GERAL';

        try {
            setSalvando(true);
            setErros({});

            await aoSalvar({
                nome: formulario.nome,
                tipo_membro_permitido: formulario.tipo_membro_permitido,
                tipo_recurso_autorizado: formulario.tipo_recurso_autorizado,
                tipo_recurso: ehRecursoGeral && formulario.tipo_recurso ? Number(formulario.tipo_recurso) : null,
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

                <div className={styles.linhaDupla}>
                    <div className={styles.campo}>
                        <label htmlFor="tipo_recurso_autorizado">Recurso autorizado *</label>
                        <select
                            id="tipo_recurso_autorizado"
                            name="tipo_recurso_autorizado"
                            value={formulario.tipo_recurso_autorizado}
                            onChange={alterarCampo}
                            required
                        >
                            <option value="AREA">Áreas</option>
                            <option value="VEICULO">Veículos</option>
                            <option value="RECURSO_GERAL">Recurso geral</option>
                        </select>
                        {mensagemErro('tipo_recurso_autorizado')}
                    </div>

                    {formulario.tipo_recurso_autorizado === 'RECURSO_GERAL' && (
                        <div className={styles.campo}>
                            <label htmlFor="tipo_recurso">Qual recurso geral *</label>
                            <select
                                id="tipo_recurso"
                                name="tipo_recurso"
                                value={formulario.tipo_recurso}
                                onChange={alterarCampo}
                                required
                            >
                                <option value="" disabled>
                                    {tiposRecurso === null ? 'Carregando...' : 'Selecione'}
                                </option>
                                {(tiposRecurso ?? []).map((tipo) => (
                                    <option key={tipo.id} value={tipo.id}>
                                        {tipo.descricao}
                                    </option>
                                ))}
                            </select>
                            {mensagemErro('tipo_recurso')}
                        </div>
                    )}
                </div>

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
