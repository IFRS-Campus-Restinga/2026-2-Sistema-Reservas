import { useEffect, useState } from 'react';
import Modal from '../../Modal/Modal';
import styles from './AreaModal.module.css';

const formularioInicial = {
    nome: '',
    capacidade: 10,
    caracteristica: '',
    disponibilidade: true,
    status: 'ATIVO',
    tipo: 'CONVENCIONAL',
    equipamento: [],
    bloco: '', // ID do bloco
};

function AreaModal({
    aberto,
    area,
    blocos,
    aoFechar,
    aoSalvar,
}) {
    const [formulario, setFormulario] = useState(formularioInicial);
    const [salvando, setSalvando] = useState(false);
    const [erros, setErros] = useState({});

    useEffect(() => {
        if (area) {
            setFormulario({
                nome: area.nome || '',
                capacidade: area.capacidade || 10,
                caracteristica: area.caracteristica || '',
                disponibilidade: area.disponibilidade !== undefined ? area.disponibilidade : true,
                status: area.status || 'ATIVO',
                tipo: area.tipo || 'CONVENCIONAL',
                equipamento: area.equipamento || [],
                bloco: typeof area.bloco === 'object' ? area.bloco?.id || '' : area.bloco || '',
            });
        } else {
            setFormulario(formularioInicial);
        }
        setErros({});
    }, [area, aberto]);

    function alterarCampo(evento) {
        const { name, value, type, checked } = evento.target;

        setFormulario({
            ...formulario,
            [name]: type === 'checkbox' ? checked : value,
        });
        setErros((anteriores) => ({ ...anteriores, [name]: '', geral: '' }));
    }

    function alterarEquipamento(evento) {
        const { value, checked } = evento.target;
        const novoEquipamento = checked 
            ? [...formulario.equipamento, value]
            : formulario.equipamento.filter(item => item !== value);

        setFormulario({
            ...formulario,
            equipamento: novoEquipamento,
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

            await aoSalvar({
                ...formulario,
                capacidade: Number(formulario.capacidade),
                bloco: Number(formulario.bloco)
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
                : { geral: 'Não foi possível salvar a área. Tente novamente.' });
        } finally {
            setSalvando(false);
        }
    }

    return (
        <Modal
            aberto={aberto}
            titulo={area ? 'Editar área' : 'Adicionar área'}
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
                        form="formulario-area"
                        disabled={salvando}
                    >
                        {salvando ? 'Salvando...' : 'Salvar'}
                    </button>
                </>
            }
        >
            <form
                id="formulario-area"
                className={styles.formulario}
                onSubmit={enviarFormulario}
                onInvalid={mostrarErro}
            >
                {mensagemErro('geral')}
                
                <div className={styles.linhaDupla}>
                    <div className={styles.campo}>
                        <label htmlFor="nome">
                            Nome *
                        </label>
                        <input
                            id="nome"
                            name="nome"
                            value={formulario.nome}
                            onChange={alterarCampo}
                            placeholder="Ex.: Sala 101"
                            minLength={4}
                            maxLength={50}
                            pattern={'.*\\S.*'}
                            aria-invalid={Boolean(erros.nome)}
                            aria-describedby="erro-nome"
                            required
                        />
                        {mensagemErro('nome')}
                    </div>

                    <div className={styles.campo}>
                        <label htmlFor="bloco">
                            Bloco *
                        </label>
                        <select
                            id="bloco"
                            name="bloco"
                            value={formulario.bloco}
                            onChange={alterarCampo}
                            aria-invalid={Boolean(erros.bloco)}
                            aria-describedby="erro-bloco"
                            required
                        >
                            <option value="" disabled>Selecione um bloco</option>
                            {blocos.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.nome}
                                </option>
                            ))}
                        </select>
                        {mensagemErro('bloco')}
                    </div>
                </div>

                <div className={styles.linhaDupla}>
                    <div className={styles.campo}>
                        <label htmlFor="tipo">
                            Tipo *
                        </label>
                        <select
                            id="tipo"
                            name="tipo"
                            value={formulario.tipo}
                            onChange={alterarCampo}
                            required
                        >
                            <option value="CONVENCIONAL">Convencional</option>
                            <option value="LABORATORIO">Laboratório</option>
                            <option value="INFORMATICA">Informática</option>
                            <option value="MUSICA">Música</option>
                            <option value="AUDITORIO">Auditório</option>
                            <option value="QUADRA">Quadra</option>
                            <option value="CHURRASQUEIRA">Churrasqueira</option>
                        </select>
                        {mensagemErro('tipo')}
                    </div>

                    <div className={styles.campo}>
                        <label htmlFor="capacidade">
                            Capacidade (pessoas) *
                        </label>
                        <input
                            id="capacidade"
                            name="capacidade"
                            type="number"
                            min="1"
                            step="1"
                            value={formulario.capacidade}
                            onChange={alterarCampo}
                            required
                        />
                        {mensagemErro('capacidade')}
                    </div>
                </div>

                <div className={styles.linhaDupla}>
                    <div className={styles.campo}>
                        <label htmlFor="status">
                            Status *
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={formulario.status}
                            onChange={alterarCampo}
                            required
                        >
                            <option value="ATIVO">Ativo</option>
                            <option value="MANUTENCAO">Manutenção</option>
                            <option value="INATIVO">Inativo</option>
                        </select>
                        {mensagemErro('status')}
                    </div>

                    <div className={styles.campo}>
                        <div className={styles.checkboxItem} style={{ marginTop: '24px' }}>
                            <input
                                id="disponibilidade"
                                name="disponibilidade"
                                type="checkbox"
                                checked={formulario.disponibilidade}
                                onChange={alterarCampo}
                            />
                            <label htmlFor="disponibilidade">
                                Disponível para Reserva
                            </label>
                        </div>
                        {mensagemErro('disponibilidade')}
                    </div>
                </div>

                <div className={styles.campo}>
                    <label>Equipamentos</label>
                    <div className={styles.checkboxContainer}>
                        <div className={styles.linhaTripla}>
                            <div className={styles.checkboxItem}>
                                <input id="eq-projetor" name="equipamento" type="checkbox" value="PROJETOR" checked={formulario.equipamento.includes('PROJETOR')} onChange={alterarEquipamento} />
                                <label htmlFor="eq-projetor">Projetor</label>
                            </div>
                            <div className={styles.checkboxItem}>
                                <input id="eq-ar" name="equipamento" type="checkbox" value="AR_CONDICIONADO" checked={formulario.equipamento.includes('AR_CONDICIONADO')} onChange={alterarEquipamento} />
                                <label htmlFor="eq-ar">Ar Condicionado</label>
                            </div>
                            <div className={styles.checkboxItem}>
                                <input id="eq-quadro" name="equipamento" type="checkbox" value="QUADRO_BRANCO" checked={formulario.equipamento.includes('QUADRO_BRANCO')} onChange={alterarEquipamento} />
                                <label htmlFor="eq-quadro">Quadro Branco</label>
                            </div>
                            <div className={styles.checkboxItem}>
                                <input id="eq-comp" name="equipamento" type="checkbox" value="COMPUTADOR" checked={formulario.equipamento.includes('COMPUTADOR')} onChange={alterarEquipamento} />
                                <label htmlFor="eq-comp">Computador</label>
                            </div>
                            <div className={styles.checkboxItem}>
                                <input id="eq-som" name="equipamento" type="checkbox" value="SISTEMA_DE_SOM" checked={formulario.equipamento.includes('SISTEMA_DE_SOM')} onChange={alterarEquipamento} />
                                <label htmlFor="eq-som">Sistema de Som</label>
                            </div>
                            <div className={styles.checkboxItem}>
                                <input id="eq-tv" name="equipamento" type="checkbox" value="TV" checked={formulario.equipamento.includes('TV')} onChange={alterarEquipamento} />
                                <label htmlFor="eq-tv">TV</label>
                            </div>
                        </div>
                    </div>
                    {mensagemErro('equipamento')}
                </div>

                <div className={styles.campo}>
                    <label htmlFor="caracteristica">
                        Características (Opcional)
                    </label>
                    <textarea
                        id="caracteristica"
                        rows={2}
                        name="caracteristica"
                        value={formulario.caracteristica}
                        onChange={alterarCampo}
                        placeholder="Detalhes adicionais da área..."
                        maxLength={300}
                        aria-invalid={Boolean(erros.caracteristica)}
                        aria-describedby="erro-caracteristica"
                    />
                    {mensagemErro('caracteristica')}
                </div>
            </form>
        </Modal>
    );
}

export default AreaModal;
