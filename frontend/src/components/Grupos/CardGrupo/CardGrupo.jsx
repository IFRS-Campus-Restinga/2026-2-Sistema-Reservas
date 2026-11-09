import { useState } from 'react';
import { CalendarDays, Pencil, Trash2, Users } from 'lucide-react';
import Botao from '../../Botao/Botao';
import ModalMembros from '../ModalMembros/ModalMembros';
import { formatarVigenciaGrupo, rotulosRecursos } from '../gruposUtils';
import styles from './CardGrupo.module.css';

function CardGrupo({ grupo, aoEditar, aoExcluir, aoAtualizar }) {
    const [modalMembrosAberto, setModalMembrosAberto] = useState(false);

    const rotuloTipoMembro = grupo.tipo_membro_permitido === 'servidor' ? 'Servidores' : 'Alunos';
    const membros = grupo.quantidade_membros === 1 ? '1 membro' : `${grupo.quantidade_membros} membros`;

    function fecharMembros() {
        setModalMembrosAberto(false);
        aoAtualizar?.();
    }

    return (
        <div className={styles.card}>
            <div className={styles.cabecalho}>
                <h3 className={styles.nome}>{grupo.nome}</h3>
                <div className={styles.acoesCabecalho}>
                    <button
                        type="button"
                        className={styles.editar}
                        onClick={() => aoEditar(grupo)}
                        title="Editar grupo"
                        aria-label={`Editar grupo ${grupo.nome}`}
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        type="button"
                        className={styles.excluir}
                        onClick={() => aoExcluir(grupo)}
                        title="Excluir grupo"
                        aria-label={`Excluir grupo ${grupo.nome}`}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className={styles.tags}>
                {rotulosRecursos(grupo).map((rotulo) => (
                    <span key={rotulo} className={styles.tag}>{rotulo}</span>
                ))}
                <span className={styles.tag} data-tipo={grupo.tipo_membro_permitido}>{rotuloTipoMembro}</span>
                <span className={styles.criador}>Criado por {grupo.criador_nome}</span>
            </div>

            <div className={styles.informacoes}>
                <span><CalendarDays size={14} aria-hidden="true" />Vigência: {formatarVigenciaGrupo(grupo)}</span>
                <span><Users size={14} aria-hidden="true" />{membros}</span>
            </div>

            <Botao
                titulo="Gerenciar membros"
                icone={Users}
                estilo="secundario"
                aoClicar={() => setModalMembrosAberto(true)}
            />

            {modalMembrosAberto && (
                <ModalMembros
                    grupo={grupo}
                    aoFechar={fecharMembros}
                />
            )}
        </div>
    );
}

export default CardGrupo;
