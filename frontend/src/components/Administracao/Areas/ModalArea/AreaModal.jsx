import SelectRemoto from '../../../SelectRemoto/SelectRemoto';
import { useEffect, useRef, useState } from 'react';
import Modal from '../../Modal/Modal';
import AlertBanner from '../../../AlertBanner/AlertBanner';
import useListaPaginada from '../../../../hooks/useListaPaginada';
import styles from './AreaModal.module.css';

const formularioInicial = {
    nome: '',
    capacidade: 10,
    caracteristica: '',
    disponibilidade: true,
    status: 'ATIVO',
    tipo: 'CONVENCIONAL',
    equipamentos: [], // IDs dos equipamentos cadastrados em Administração > Cadastros
    bloco: '', // ID do bloco
};

function AreaModal({
    aberto,
    area,
    aoFechar,
    aoSalvar,
}) {
    const controleModal = useRef(null);
    const [formulario, setFormulario] = useState(formularioInicial);
    const [salvando, setSalvando] = useState(false);
    const [erros, setErros] = useState({});
    const { itens: equipamentosDisponiveis, carregando: carregandoEquipamentos } = useListaPaginada(
        '/api/equipamentos-area/', { page_size: 100 }, aberto,
    );

    useEffect(() => {
        if (area) {
            setFormulario({
                nome: area.nome || '',
                capacidade: area.capacidade || 10,
                caracteristica: area.caracteristica || '',
                disponibilidade: area.disponibilidade !== undefined ? area.disponibilidade : true,
                status: area.status || 'ATIVO',
                tipo: area.tipo || 'CONVENCIONAL',
                equipamentos: area.equipamentos || [],
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
        const id = Number(value);
        const novosEquipamentos = checked
            ? [...formulario.equipamentos, id]
            : formulario.equipamentos.filter(item => item !== id);

        setFormulario({
            ...formulario,
            equipamentos: novosEquipamentos,
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
            ref={controleModal}
            confirmarDescarte
            aberto={aberto}
            titulo={area ? 'Editar área' : 'Adicionar área'}
            aoFechar={aoFechar}
            rodape={
                <>
                    <button
                        type="button"
                        className={styles.cancelar}
                        onClick={() => controleModal.current?.fechar()}
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
                <AlertBanner tipo="erro" mensagem={erros.geral} />
                
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
                            minLength={3}
                            maxLength={100}
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
                        <SelectRemoto id="bloco" url="/api/blocos/" ativo={aberto}
                            filtros={{ page_size: 100 }} mostrarBusca={false} required
                            ariaLabel="Bloco" valor={formulario.bloco}
                            aoAlterar={(valor) => alterarCampo({ target: { name: 'bloco', value: valor } })} />
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
                        {carregandoEquipamentos && <small role="status">Carregando equipamentos...</small>}
                        {!carregandoEquipamentos && equipamentosDisponiveis.length === 0 && (
                            <small>Nenhum equipamento cadastrado.</small>
                        )}
                        <div className={styles.linhaTripla}>
                            {equipamentosDisponiveis.map((equipamento) => (
                                <div key={equipamento.id} className={styles.checkboxItem}>
                                    <input
                                        id={`eq-${equipamento.id}`}
                                        name="equipamentos"
                                        type="checkbox"
                                        value={equipamento.id}
                                        checked={formulario.equipamentos.includes(equipamento.id)}
                                        onChange={alterarEquipamento}
                                    />
                                    <label htmlFor={`eq-${equipamento.id}`}>{equipamento.nome}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    {mensagemErro('equipamentos')}
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
