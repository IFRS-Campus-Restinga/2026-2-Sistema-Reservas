import { useId, useRef, useState } from 'react';
import Modal from '../../Modal/Modal';
import AlertBanner from '../../../AlertBanner/AlertBanner';
import SelectRemoto from '../../../SelectRemoto/SelectRemoto';
import styles from './CadastroSimples.module.css';

function valoresIniciais(campos, item) {
    return Object.fromEntries(campos.map((campo) => [campo.nome, item?.[campo.nome] ?? campo.padrao ?? '']));
}

function ModalCadastro({ titulo, campos, item, aoFechar, aoSalvar }) {
    const idFormulario = useId();
    const controleModal = useRef(null);
    const [formulario, setFormulario] = useState(() => valoresIniciais(campos, item));
    const [salvando, setSalvando] = useState(false);
    const [erros, setErros] = useState({});

    function alterar(nome, valor) {
        setFormulario((atual) => ({ ...atual, [nome]: valor }));
        setErros((atuais) => ({ ...atuais, [nome]: '', geral: '' }));
    }

    async function enviar(evento) {
        evento.preventDefault();
        setSalvando(true);
        setErros({});
        try {
            const dados = { ...formulario };
            // Campos de seleção vazios vão como null para o backend aceitar "sem valor".
            campos.forEach((campo) => {
                if (campo.tipo !== 'texto' && dados[campo.nome] === '') dados[campo.nome] = null;
            });
            await aoSalvar(dados);
        } catch (falha) {
            const errosApi = falha.response?.data;
            const novosErros = {};
            if (falha.response?.status === 400 && errosApi && typeof errosApi === 'object') {
                for (const [campo, mensagens] of Object.entries(errosApi)) {
                    const chave = campos.some((c) => c.nome === campo) ? campo : 'geral';
                    novosErros[chave] = Array.isArray(mensagens) ? mensagens.join(' ') : String(mensagens);
                }
            }
            setErros(Object.keys(novosErros).length > 0
                ? novosErros
                : { geral: 'Não foi possível salvar. Tente novamente.' });
        } finally {
            setSalvando(false);
        }
    }

    function renderizarCampo(campo) {
        const id = `${idFormulario}-${campo.nome}`;
        const comuns = {
            id,
            name: campo.nome,
            required: campo.obrigatorio,
            'aria-invalid': Boolean(erros[campo.nome]),
        };

        if (campo.tipo === 'select') {
            return (
                <select {...comuns} value={formulario[campo.nome] ?? ''} onChange={(e) => alterar(campo.nome, e.target.value)}>
                    {!campo.obrigatorio && <option value="">Nenhum</option>}
                    {campo.opcoes.map((opcao) => (
                        <option key={opcao.valor} value={opcao.valor}>{opcao.rotulo}</option>
                    ))}
                </select>
            );
        }
        if (campo.tipo === 'remoto') {
            return (
                <SelectRemoto id={id} url={campo.url} filtros={{ page_size: 100 }} mostrarBusca={false}
                    required={campo.obrigatorio} ariaLabel={campo.rotulo} valor={formulario[campo.nome] ?? ''}
                    rotuloTodos={campo.obrigatorio ? 'Selecione' : 'Nenhuma'}
                    aoAlterar={(valor) => alterar(campo.nome, valor)} />
            );
        }
        return (
            <input {...comuns} value={formulario[campo.nome] ?? ''} maxLength={campo.maxLength}
                placeholder={campo.placeholder} onChange={(e) => alterar(campo.nome, e.target.value)} />
        );
    }

    return (
        <Modal
            ref={controleModal}
            aberto
            confirmarDescarte
            titulo={titulo}
            aoFechar={aoFechar}
            processando={salvando}
            rodape={(
                <>
                    <button type="button" className={styles.cancelar} onClick={() => controleModal.current?.fechar()} disabled={salvando}>
                        Cancelar
                    </button>
                    <button type="submit" className={styles.salvar} form={idFormulario} disabled={salvando}>
                        {salvando ? 'Salvando...' : 'Salvar'}
                    </button>
                </>
            )}
        >
            <form id={idFormulario} className={styles.formulario} onSubmit={enviar}>
                <AlertBanner tipo="erro" mensagem={erros.geral} />
                {campos.map((campo) => (
                    <div key={campo.nome} className={styles.campo}>
                        <label htmlFor={`${idFormulario}-${campo.nome}`}>
                            {campo.rotulo}{campo.obrigatorio && ' *'}
                        </label>
                        {renderizarCampo(campo)}
                        {erros[campo.nome] && <p className={styles.erro} role="alert">{erros[campo.nome]}</p>}
                    </div>
                ))}
            </form>
        </Modal>
    );
}

export default ModalCadastro;
