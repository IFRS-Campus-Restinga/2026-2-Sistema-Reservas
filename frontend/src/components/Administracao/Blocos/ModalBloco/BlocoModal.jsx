import { useEffect, useState } from 'react';
import Modal from '../../Modal/Modal';
import styles from './BlocoModal.module.css';

const formularioInicial = {
    numero: '',
    nome: '',
    banheiro: true,
    acessibilidade: [],
};

function BlocoModal({
    aberto,
    bloco,
    aoFechar,
    aoSalvar,
}) {
    const [formulario, setFormulario] = useState(formularioInicial);
    const [salvando, setSalvando] = useState(false);
    const [erros, setErros] = useState({});

    useEffect(() => {
        if (bloco) {
            setFormulario({
                numero: bloco.numero || '',
                nome: bloco.nome || '',
                banheiro: bloco.banheiro !== undefined ? bloco.banheiro : true,
                acessibilidade: bloco.acessibilidade || [],
            });
        } else {
            setFormulario(formularioInicial);
        }
        setErros({});
    }, [bloco, aberto]);

    function alterarCampo(evento) {
        const { name, value, type, checked } = evento.target;

        setFormulario({
            ...formulario,
            [name]: type === 'checkbox' ? checked : value,
        });
        setErros((anteriores) => ({ ...anteriores, [name]: '', geral: '' }));
    }

    function alterarAcessibilidade(evento) {
        const { value, checked } = evento.target;
        const novaAcessibilidade = checked 
            ? [...formulario.acessibilidade, value]
            : formulario.acessibilidade.filter(item => item !== value);

        setFormulario({
            ...formulario,
            acessibilidade: novaAcessibilidade,
        });
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

            await aoSalvar(formulario);
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
                : { geral: 'Não foi possível salvar o bloco. Tente novamente.' });
        } finally {
            setSalvando(false);
        }
    }

    return (
        <Modal
            aberto={aberto}
            titulo={bloco ? 'Editar bloco' : 'Adicionar bloco'}
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
                        form="formulario-bloco"
                        disabled={salvando}
                    >
                        {salvando ? 'Salvando...' : 'Salvar'}
                    </button>
                </>
            }
        >
            <form
                id="formulario-bloco"
                className={styles.formulario}
                onSubmit={enviarFormulario}
                onInvalid={mostrarErro}
            >
                {mensagemErro('geral')}
                
                <div className={styles.linhaDupla}>
                    <div className={styles.campo}>
                        <label htmlFor="numero">
                            Número *
                        </label>
                        <input
                            id="numero"
                            name="numero"
                            value={formulario.numero}
                            onChange={alterarCampo}
                            placeholder="Ex.: 1 ou 12"
                            minLength={1}
                            maxLength={2}
                            pattern="[0-9]+"
                            title="Apenas números (1 ou 2 dígitos)"
                            aria-invalid={Boolean(erros.numero)}
                            aria-describedby="erro-numero"
                            required
                        />
                        {mensagemErro('numero')}
                    </div>

                    <div className={styles.campo}>
                        <label htmlFor="nome">
                            Nome *
                        </label>
                        <input
                            id="nome"
                            name="nome"
                            value={formulario.nome}
                            onChange={alterarCampo}
                            placeholder="Ex.: Bloco Principal"
                            minLength={3}
                            maxLength={100}
                            pattern={'.*\\S.*'}
                            aria-invalid={Boolean(erros.nome)}
                            aria-describedby="erro-nome"
                            required
                        />
                        {mensagemErro('nome')}
                    </div>
                </div>

                <div className={styles.campo}>
                    <div className={styles.checkboxItem}>
                        <input
                            id="banheiro"
                            name="banheiro"
                            type="checkbox"
                            checked={formulario.banheiro}
                            onChange={alterarCampo}
                        />
                        <label htmlFor="banheiro">
                            Possui Banheiro
                        </label>
                    </div>
                    {mensagemErro('banheiro')}
                </div>

                <div className={styles.campo}>
                    <label>Acessibilidade</label>
                    <div className={styles.checkboxContainer}>
                        <div className={styles.checkboxItem}>
                            <input
                                id="acessibilidade-piso"
                                name="acessibilidade"
                                type="checkbox"
                                value="PISO_TATIL"
                                checked={formulario.acessibilidade.includes('PISO_TATIL')}
                                onChange={alterarAcessibilidade}
                            />
                            <label htmlFor="acessibilidade-piso">Piso Tátil</label>
                        </div>
                        <div className={styles.checkboxItem}>
                            <input
                                id="acessibilidade-banheiro"
                                name="acessibilidade"
                                type="checkbox"
                                value="BANHEIRO"
                                checked={formulario.acessibilidade.includes('BANHEIRO')}
                                onChange={alterarAcessibilidade}
                            />
                            <label htmlFor="acessibilidade-banheiro">Banheiro Adaptado</label>
                        </div>
                        <div className={styles.checkboxItem}>
                            <input
                                id="acessibilidade-bebedouro"
                                name="acessibilidade"
                                type="checkbox"
                                value="BEBEDOURO"
                                checked={formulario.acessibilidade.includes('BEBEDOURO')}
                                onChange={alterarAcessibilidade}
                            />
                            <label htmlFor="acessibilidade-bebedouro">Bebedouro Adaptado</label>
                        </div>
                    </div>
                    {mensagemErro('acessibilidade')}
                </div>
            </form>
        </Modal>
    );
}

export default BlocoModal;
