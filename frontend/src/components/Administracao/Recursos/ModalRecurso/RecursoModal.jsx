import { useEffect, useState } from 'react';
import Modal from '../../Modal/Modal';
import styles from './RecursoModal.module.css';

const formularioInicial = {
    nome: '',
    tipo_recurso: '',
    codigo: '',
    tipo_prazo: 'CURTO_PRAZO',
    quantidade_total: 1,
    tem_termo_de_responsabilidade: false,
    observacao: '',
    status: 'ATIVO',
};

function RecursoModal({
    aberto,
    recurso,
    tipos,
    aoFechar,
    aoSalvar,
}) {
    const [formulario, setFormulario] = useState(formularioInicial);
    const [salvando, setSalvando] = useState(false);
    const [erros, setErros] = useState({});

    useEffect(() => {
        if (recurso) {
            setFormulario({
                nome: recurso.nome || '',
                tipo_recurso: recurso.tipo_recurso || '',
                codigo: recurso.codigo || '',
                tipo_prazo: recurso.tipo_prazo || 'CURTO_PRAZO',
                quantidade_total: recurso.quantidade_total ?? 1,
                tem_termo_de_responsabilidade: Boolean(recurso.tem_termo_de_responsabilidade),
                observacao: recurso.observacao || '',
                status: recurso.status || 'ATIVO',
            });
        } else {
            setFormulario({
                ...formularioInicial,
                tipo_recurso: tipos[0]?.id || '',
            });
        }

        setErros({});
    }, [recurso, aberto, tipos]);

    function alterarCampo(evento) {
        const { name, value, type, checked } = evento.target;

        setFormulario({
            ...formulario,
            [name]: type === 'checkbox' ? checked : value,
        });

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

        try {
            setSalvando(true);
            setErros({});

            await aoSalvar({
                ...formulario,
                tipo_recurso: Number(formulario.tipo_recurso),
                quantidade_total: Number(formulario.quantidade_total),
            });
        } catch (erro) {
            const errosApi = erro.dados;
            const novosErros = {};

            if (errosApi && typeof errosApi === 'object') {
                for (const [campo, mensagens] of Object.entries(errosApi)) {
                    const chave = Object.hasOwn(formularioInicial, campo) ? campo : 'geral';
                    novosErros[chave] = Array.isArray(mensagens)
                        ? mensagens.join(' ')
                        : String(mensagens);
                }
            }

            setErros(Object.keys(novosErros).length > 0
                ? novosErros
                : { geral: erro.message || 'Não foi possível salvar o recurso.' });
        } finally {
            setSalvando(false);
        }
    }

    return (
        <Modal
            aberto={aberto}
            titulo={recurso ? 'Editar recurso' : 'Adicionar recurso'}
            aoFechar={aoFechar}
            rodape={
                <>
                    <button
                        type="button"
                        className={styles.cancelar}
                        onClick={aoFechar}
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        className={styles.salvar}
                        form="formulario-recurso"
                        disabled={salvando}
                    >
                        {salvando ? 'Salvando...' : 'Salvar'}
                    </button>
                </>
            }
        >
            <form
                id="formulario-recurso"
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
                        placeholder="Ex.: Notebook Dell Latitude"
                        minLength={3}
                        maxLength={50}
                        pattern={'.*\\S.*'}
                        aria-invalid={Boolean(erros.nome)}
                        aria-describedby="erro-nome"
                        required
                    />
                    {mensagemErro('nome')}
                </div>

                <div className={styles.linhaDupla}>
                    <div className={styles.campo}>
                        <label htmlFor="tipo_recurso">Tipo de recurso *</label>
                        <select
                            id="tipo_recurso"
                            name="tipo_recurso"
                            value={formulario.tipo_recurso}
                            onChange={alterarCampo}
                            aria-invalid={Boolean(erros.tipo_recurso)}
                            aria-describedby="erro-tipo_recurso"
                            required
                        >
                            {tipos.map((tipo) => (
                                <option key={tipo.id} value={tipo.id}>
                                    {tipo.descricao}
                                </option>
                            ))}
                        </select>
                        {mensagemErro('tipo_recurso')}
                    </div>

                    <div className={styles.campo}>
                        <label htmlFor="codigo">Código</label>
                        <input
                            id="codigo"
                            name="codigo"
                            value={formulario.codigo}
                            onChange={alterarCampo}
                            placeholder="Opcional"
                            maxLength={50}
                            aria-invalid={Boolean(erros.codigo)}
                            aria-describedby="erro-codigo"
                        />
                        {mensagemErro('codigo')}
                    </div>
                </div>

                <div className={styles.linhaDupla}>
                    <div className={styles.campo}>
                        <label htmlFor="tipo_prazo">Prazo *</label>
                        <select
                            id="tipo_prazo"
                            name="tipo_prazo"
                            value={formulario.tipo_prazo}
                            onChange={alterarCampo}
                            aria-invalid={Boolean(erros.tipo_prazo)}
                            aria-describedby="erro-tipo_prazo"
                            required
                        >
                            <option value="CURTO_PRAZO">Curto prazo</option>
                            <option value="LONGO_PRAZO">Longo prazo</option>
                        </select>
                        {mensagemErro('tipo_prazo')}
                    </div>

                    <div className={styles.campo}>
                        <label htmlFor="quantidade_total">Quantidade total *</label>
                        <input
                            id="quantidade_total"
                            name="quantidade_total"
                            type="number"
                            min="0"
                            step="1"
                            value={formulario.quantidade_total}
                            onChange={alterarCampo}
                            aria-invalid={Boolean(erros.quantidade_total)}
                            aria-describedby="erro-quantidade_total"
                            required
                        />
                        {mensagemErro('quantidade_total')}
                    </div>
                </div>

                <div className={styles.campo}>
                    <label htmlFor="observacao">Observação</label>
                    <textarea
                        id="observacao"
                        name="observacao"
                        rows={2}
                        value={formulario.observacao}
                        onChange={alterarCampo}
                        placeholder="Descreva o recurso..."
                        maxLength={50}
                        aria-invalid={Boolean(erros.observacao)}
                        aria-describedby="erro-observacao"
                    />
                    {mensagemErro('observacao')}
                </div>

                <label className={styles.checkbox} htmlFor="tem_termo_de_responsabilidade">
                    <input
                        id="tem_termo_de_responsabilidade"
                        name="tem_termo_de_responsabilidade"
                        type="checkbox"
                        checked={formulario.tem_termo_de_responsabilidade}
                        onChange={alterarCampo}
                    />
                    <span>Exige termo de responsabilidade</span>
                </label>

                <div className={styles.campo}>
                    <label htmlFor="status">Status *</label>
                    <select
                        id="status"
                        name="status"
                        value={formulario.status}
                        onChange={alterarCampo}
                        aria-invalid={Boolean(erros.status)}
                        aria-describedby="erro-status"
                        required
                    >
                        <option value="ATIVO">Ativo</option>
                        <option value="MANUTENCAO">Manutenção</option>
                        <option value="INATIVO">Inativo</option>
                    </select>
                    {mensagemErro('status')}
                </div>
            </form>
        </Modal>
    );
}

export default RecursoModal;
