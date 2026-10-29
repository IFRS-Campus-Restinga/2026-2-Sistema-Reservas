import { useEffect, useState } from 'react';
import styles from './ModalDetalheAuditoria.module.css';

import { buscarLogAuditoria } from '../../../../services';
import {
    ITENS_VISIVEIS_LISTA_AUDITORIA,
    LIMITE_LISTA_AUDITORIA,
    PERFIL_RESPONSAVEL_LABEL,
    camposAuditoria,
    formatarDataHoraAuditoria,
    rotuloAcaoAuditoria,
} from '../../../../utils/auditoria';

import Modal from '../../Modal/Modal';
import Botao from '../../../Botao/Botao';

function pessoa(nome, email) {
    if (!nome && !email) return '-';
    return [nome, email].filter(Boolean).join(' · ');
}

// Listas longas (ex.: datas de uma recorrência) aparecem resumidas, com opção de expandir
function ValorAuditoria({ valor }) {
    const [expandido, setExpandido] = useState(false);

    if (!Array.isArray(valor)) return valor;

    if (valor.length <= LIMITE_LISTA_AUDITORIA) return valor.join(', ');

    if (expandido) {
        return (
            <>
                <div className={styles.listaExpandida}>{valor.join(', ')}</div>
                <button type="button" className={styles.alternarLista} onClick={() => setExpandido(false)}>
                    ver menos
                </button>
            </>
        );
    }

    return (
        <>
            {valor.slice(0, ITENS_VISIVEIS_LISTA_AUDITORIA).join(', ')}
            {` … e mais ${valor.length - ITENS_VISIVEIS_LISTA_AUDITORIA}`}
            <button type="button" className={styles.alternarLista} onClick={() => setExpandido(true)}>
                ver todas
            </button>
        </>
    );
}

function ModalDetalheAuditoria({ log, aoFechar }) {
    const [detalhe, setDetalhe] = useState(null);
    const [erro, setErro] = useState('');
    const [somenteAlterados, setSomenteAlterados] = useState(false);

    useEffect(() => {
        buscarLogAuditoria(log.id)
            .then(setDetalhe)
            .catch(() => setErro('Não foi possível carregar o detalhe do registro.'));
    }, [log.id]);

    const comparavel = Boolean(detalhe?.dados_antes && detalhe?.dados_depois);
    const campos = detalhe ? camposAuditoria(detalhe) : [];
    const camposVisiveis = somenteAlterados ? campos.filter((campo) => campo.alterado) : campos;

    return (
        <Modal
            aberto
            titulo={`${log.entidade_descricao} · ${log.descricao}`}
            aoFechar={aoFechar}
            variante="largo"
            rodape={<Botao titulo="Fechar" aoClicar={aoFechar} />}
        >
            <div className={styles.detalhe}>
                <span className={styles.acao} data-acao={log.acao}>
                    {rotuloAcaoAuditoria(log)}
                </span>

                <dl className={styles.informacoes}>
                    <div>
                        <dt>Responsável</dt>
                        <dd>
                            {pessoa(log.responsavel_nome, log.responsavel_email)}
                            {' '}
                            ({PERFIL_RESPONSAVEL_LABEL[log.perfil_responsavel] || log.perfil_responsavel_descricao})
                        </dd>
                    </div>
                    <div>
                        <dt>Data e hora</dt>
                        <dd>{formatarDataHoraAuditoria(log.data)}</dd>
                    </div>
                    <div>
                        <dt>Usuário afetado</dt>
                        <dd>{pessoa(log.usuario_afetado_nome, log.usuario_afetado_email)}</dd>
                    </div>
                    <div>
                        <dt>Registro</dt>
                        <dd>
                            {log.objeto_id
                                ? `${log.entidade_descricao} nº ${log.objeto_id}`
                                : log.entidade_descricao}
                        </dd>
                    </div>
                </dl>

                {erro && <p className={styles.erro} role="alert">{erro}</p>}

                {!detalhe && !erro && (
                    <p className={styles.carregando} role="status">Carregando alterações...</p>
                )}

                {detalhe && (
                    <div className={styles.alteracoes}>
                        <div className={styles.alteracoesCabecalho}>
                            <h3>{comparavel ? 'Alterações' : 'Dados do registro'}</h3>
                            {comparavel && (
                                <label className={styles.somenteAlterados}>
                                    <input
                                        type="checkbox"
                                        checked={somenteAlterados}
                                        onChange={(evento) => setSomenteAlterados(evento.target.checked)}
                                    />
                                    Mostrar só os campos alterados
                                </label>
                            )}
                        </div>

                        <div className={styles.tabelaContainer}>
                            <table className={styles.tabela}>
                                <thead>
                                    <tr>
                                        <th scope="col">Campo</th>
                                        <th scope="col">Antes</th>
                                        <th scope="col">Depois</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {camposVisiveis.map((campo) => (
                                        <tr key={campo.campo} data-alterado={campo.alterado}>
                                            <td className={styles.nomeCampo}>{campo.rotulo}</td>
                                            <td className={styles.antes}>
                                                <ValorAuditoria valor={campo.antes} />
                                            </td>
                                            <td className={styles.depois}>
                                                <ValorAuditoria valor={campo.depois} />
                                            </td>
                                        </tr>
                                    ))}
                                    {camposVisiveis.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className={styles.vazio}>
                                                Nenhum campo para exibir.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default ModalDetalheAuditoria;
