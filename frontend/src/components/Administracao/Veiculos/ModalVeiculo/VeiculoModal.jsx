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
    }, [veiculo, aberto]);

    function alterarCampo(evento) {
        const { name, value } = evento.target;

        setFormulario({
            ...formulario,
            [name]: value,
        });
    }

    async function enviarFormulario(evento) {
        evento.preventDefault();

        try {
            setSalvando(true);

            await aoSalvar({
                ...formulario,
                capacidade: Number(formulario.capacidade),
            });
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
            >
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
                        required
                    />
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
                            required
                        />
                    </div>

                    <div className={styles.campo}>
                        <label htmlFor="cor">
                            Cor
                        </label>

                        <input
                            id="cor"
                            name="cor"
                            value={formulario.cor}
                            onChange={alterarCampo}
                            placeholder="Branco"
                        />
                    </div>
                </div>

                <div className={styles.linhaDupla}>
                    <div className={styles.campo}>
                        <label htmlFor="marca">
                            Marca
                        </label>

                        <input
                            id="marca"
                            name="marca"
                            value={formulario.marca}
                            onChange={alterarCampo}
                            placeholder="Ex.: Fiat"
                        />
                    </div>

                    <div className={styles.campo}>
                        <label htmlFor="modelo">
                            Modelo
                        </label>

                        <input
                            id="modelo"
                            name="modelo"
                            value={formulario.modelo}
                            onChange={alterarCampo}
                            placeholder="Ex.: Ducato"
                        />
                    </div>
                </div>

                <div className={styles.linhaTripla}>
                    <div className={styles.campo}>
                        <label htmlFor="capacidade">
                            Lugares
                        </label>

                        <input
                            id="capacidade"
                            name="capacidade"
                            type="number"
                            min="1"
                            value={formulario.capacidade}
                            onChange={alterarCampo}
                        />
                    </div>

                    <div className={styles.campo}>
                        <label htmlFor="combustivel">
                            Combustível
                        </label>

                        <input
                            id="combustivel"
                            name="combustivel"
                            value={formulario.combustivel}
                            onChange={alterarCampo}
                            placeholder="Flex"
                        />
                    </div>

                    <div className={styles.campo}>
                        <label htmlFor="quilometragem">
                            Quilometragem
                        </label>

                        <input
                            id="quilometragem"
                            name="quilometragem"
                            value={formulario.quilometragem}
                            onChange={alterarCampo}
                            placeholder="0 km"
                        />
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
                    />
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
                </div>
            </form>
        </Modal>
    );
}

export default VeiculoModal;
