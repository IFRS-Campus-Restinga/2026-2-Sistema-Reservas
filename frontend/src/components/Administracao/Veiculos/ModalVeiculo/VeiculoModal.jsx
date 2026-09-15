import { useEffect, useState } from 'react';
import Modal from '../../Modal/Modal';
import styles from './VeiculoModal.module.css';

const formularioInicial = {
    nome: '',
    placa: '',
    cor: '',
    marca: '',
    modelo: '',
    capacidade: 5,
    combustivel: '',
    quilometragem: '',
    observacao: '',
    status: 'ATIVO',
};

function VeiculoModal({
    aberto,
    veiculo,
    aoFechar,
    aoSalvar,
}) {
    const [formulario, setFormulario] = useState(formularioInicial);
    const [salvando, setSalvando] = useState(false);
    const [erros, setErros] = useState({});

    useEffect(() => {
        if (veiculo) {
            setFormulario({
                nome: veiculo.nome || '',
                placa: veiculo.placa || '',
                cor: veiculo.cor || '',
                marca: veiculo.marca || '',
                modelo: veiculo.modelo || '',
                capacidade: veiculo.capacidade || 5,
                combustivel: veiculo.combustivel || '',
                quilometragem: veiculo.quilometragem || 0,
                observacao: veiculo.observacao || '',
                status: veiculo.status || 'ATIVO',
            });
        } else {
            setFormulario(formularioInicial);
        }
        setErros({});
    }, [veiculo, aberto]);

    function alterarCampo(evento) {
        const { name, value } = evento.target;

        setFormulario({
            ...formulario,
            [name]: name === 'placa' ? value.toUpperCase() : value,
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
                capacidade: Number(formulario.capacidade),
                quilometragem: Number(formulario.quilometragem),
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
                : { geral: 'Não foi possível salvar o veículo. Tente novamente.' });
        } finally {
            setSalvando(false);
        }
    }

    return (
        <Modal
            aberto={aberto}
            titulo={veiculo ? 'Editar veículo' : 'Adicionar veículo'}
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
                        form="formulario-veiculo"
                        disabled={salvando}
                    >
                        {salvando ? 'Salvando...' : 'Salvar'}
                    </button>
                </>
            }
        >
            <form
                id="formulario-veiculo"
                className={styles.formulario}
                onSubmit={enviarFormulario}
                onInvalid={mostrarErro}
            >
                {mensagemErro('geral')}
                <div className={styles.campo}>
                    <label htmlFor="nome">
                        Nome *
                    </label>

                    <input
                        id="nome"
                        name="nome"
                        value={formulario.nome}
                        onChange={alterarCampo}
                        placeholder="Ex.: Carro Administrativo"
                        minLength={3}
                        maxLength={30}
                        pattern={'.*\\S.*'}
                        aria-invalid={Boolean(erros.nome)}
                        aria-describedby="erro-nome"
                        required
                    />
                    {mensagemErro('nome')}
                </div>

                <div className={styles.linhaDupla}>
                    <div className={styles.campo}>
                        <label htmlFor="placa">
                            Placa *
                        </label>

                        <input
                            id="placa"
                            name="placa"
                            value={formulario.placa}
                            onChange={alterarCampo}
                            placeholder="ABC1D23"
                            minLength={7}
                            maxLength={7}
                            pattern="[A-Z]{3}[0-9]{4}|[A-Z]{3}[0-9][A-Z][0-9]{2}"
                            title="Use ABC1234 ou ABC1D23, sem espaços ou hífen."
                            aria-invalid={Boolean(erros.placa)}
                            aria-describedby="erro-placa"
                            required
                        />
                        {mensagemErro('placa')}
                    </div>

                    <div className={styles.campo}>
                        <label htmlFor="cor">
                            Cor *
                        </label>

                        <input
                            id="cor"
                            name="cor"
                            value={formulario.cor}
                            onChange={alterarCampo}
                            placeholder="Branco"
                            minLength={2}
                            maxLength={20}
                            pattern={'.*\\S.*'}
                            aria-invalid={Boolean(erros.cor)}
                            aria-describedby="erro-cor"
                            required
                        />
                        {mensagemErro('cor')}
                    </div>
                </div>

                <div className={styles.linhaDupla}>
                    <div className={styles.campo}>
                        <label htmlFor="marca">
                            Marca *
                        </label>

                        <input
                            id="marca"
                            name="marca"
                            value={formulario.marca}
                            onChange={alterarCampo}
                            placeholder="Ex.: Fiat"
                            minLength={2}
                            maxLength={50}
                            pattern={'.*\\S.*'}
                            aria-invalid={Boolean(erros.marca)}
                            aria-describedby="erro-marca"
                            required
                        />
                        {mensagemErro('marca')}
                    </div>

                    <div className={styles.campo}>
                        <label htmlFor="modelo">
                            Modelo *
                        </label>

                        <input
                            id="modelo"
                            name="modelo"
                            value={formulario.modelo}
                            onChange={alterarCampo}
                            placeholder="Ex.: Ducato"
                            minLength={2}
                            maxLength={50}
                            pattern={'.*\\S.*'}
                            aria-invalid={Boolean(erros.modelo)}
                            aria-describedby="erro-modelo"
                            required
                        />
                        {mensagemErro('modelo')}
                    </div>
                </div>

                <div className={styles.linhaTripla}>
                    <div className={styles.campo}>
                        <label htmlFor="capacidade">
                            Lugares *
                        </label>

                        <input
                            id="capacidade"
                            name="capacidade"
                            type="number"
                            min="1"
                            step="1"
                            value={formulario.capacidade}
                            onChange={alterarCampo}
                            aria-invalid={Boolean(erros.capacidade)}
                            aria-describedby="erro-capacidade"
                            required
                        />
                        {mensagemErro('capacidade')}
                    </div>

                    <div className={styles.campo}>
                        <label htmlFor="combustivel">
                            Combustível *
                        </label>

                        <input
                            id="combustivel"
                            name="combustivel"
                            value={formulario.combustivel}
                            onChange={alterarCampo}
                            placeholder="Flex"
                            maxLength={20}
                            pattern={'.*\\S.*'}
                            aria-invalid={Boolean(erros.combustivel)}
                            aria-describedby="erro-combustivel"
                            required
                        />
                        {mensagemErro('combustivel')}
                    </div>

                    <div className={styles.campo}>
                        <label htmlFor="quilometragem">
                            Quilometragem *
                        </label>

                        <input
                            id="quilometragem"
                            name="quilometragem"
                            type="number"
                            min="0"
                            step="any"
                            value={formulario.quilometragem}
                            onChange={alterarCampo}
                            placeholder="0 km"
                            aria-invalid={Boolean(erros.quilometragem)}
                            aria-describedby="erro-quilometragem"
                            required
                        />
                        {mensagemErro('quilometragem')}
                    </div>
                </div>

                <div className={styles.campo}>
                    <label htmlFor="observacao">
                        Observação
                    </label>

                    <textarea
                        id="observacao"
                        rows={2}
                        name="observacao"
                        value={formulario.observacao}
                        onChange={alterarCampo}
                        placeholder="Uso recomendado, restrições..."
                        maxLength={50}
                        aria-invalid={Boolean(erros.observacao)}
                        aria-describedby="erro-observacao"
                    />
                    {mensagemErro('observacao')}
                </div>

                <div className={styles.campo}>
                    <label htmlFor="status">
                        Status
                    </label>

                    <select
                        id="status"
                        name="status"
                        value={formulario.status}
                        onChange={alterarCampo}
                        aria-invalid={Boolean(erros.status)}
                        aria-describedby="erro-status"
                        required
                    >
                        <option value="ATIVO">
                            Ativo
                        </option>

                        <option value="MANUTENCAO">
                            Manutenção
                        </option>

                        <option value="INATIVO">
                            Inativo
                        </option>
                    </select>
                    {mensagemErro('status')}
                </div>
            </form>
        </Modal>
    );
}

export default VeiculoModal;
