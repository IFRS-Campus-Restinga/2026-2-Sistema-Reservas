import { Fragment, useState } from 'react';
import { Dropdown, Spinner } from 'react-bootstrap';
import { Check, ChevronDown } from 'lucide-react';

import { entrarComoUsuarioDemonstracao, listarUsuariosDemonstracao } from '../../../services';
import { PAPEL_USUARIO_LABEL } from '../../../utils/usuario';
import styles from './VisualizarComo.module.css';

const PERFIS_DEMONSTRACAO = [
    { perfil: 'admin', rotulo: PAPEL_USUARIO_LABEL.admin },
    { perfil: 'servidor', rotulo: PAPEL_USUARIO_LABEL.servidor },
    { perfil: 'aluno', rotulo: PAPEL_USUARIO_LABEL.aluno },
    { perfil: 'convidado', rotulo: 'Convidado / Externo' },
];

function VisualizarComo({ usuario, children }) {
    const [menuAberto, setMenuAberto] = useState(false);
    const [trocandoPara, setTrocandoPara] = useState(null);
    const [erro, setErro] = useState('');
    const [usuariosDemonstracao, setUsuariosDemonstracao] = useState(null);

    if (!usuario?.modo_demonstracao) return children;

    async function alternarMenu(aberto) {
        setMenuAberto(aberto);
        if (!aberto || usuariosDemonstracao) return;
        setErro('');
        try {
            setUsuariosDemonstracao(await listarUsuariosDemonstracao());
        } catch {
            setErro('Não foi possível carregar os usuários de demonstração.');
        }
    }

    async function trocar(chave) {
        setTrocandoPara(chave);
        setErro('');
        try {
            await entrarComoUsuarioDemonstracao(chave);
            window.location.assign('/');
        } catch {
            setErro('Não foi possível trocar de usuário.');
            setTrocandoPara(null);
        }
    }

    return (
        <Dropdown align="end" onToggle={alternarMenu}>
            <Dropdown.Toggle
                as="button"
                type="button"
                className={styles.gatilho}
                aria-label="Visualizar como outro usuário"
                disabled={trocandoPara !== null}
            >
                {children}
                <ChevronDown size={16} className={`${styles.seta} ${menuAberto ? styles.setaAberta : ''}`} />
            </Dropdown.Toggle>

            <Dropdown.Menu
                className={styles.menu}
                popperConfig={{
                    modifiers: [{ name: 'offset', options: { offset: [0, 8] } }],
                }}
            >
                <div className={styles.cabecalho}>
                    <p className={styles.titulo}>Visualizar como</p>
                    <p className={styles.subtitulo}>Alternar usuário de demonstração do protótipo</p>
                </div>

                {!usuariosDemonstracao && !erro && (
                    <p className={styles.carregando} role="status">Carregando usuários...</p>
                )}

                {PERFIS_DEMONSTRACAO.map(({ perfil, rotulo }) => {
                    const usuariosDoPerfil = (usuariosDemonstracao ?? []).filter((item) => item.papel === perfil);

                    if (usuariosDoPerfil.length === 0) return null;

                    return (
                        <Fragment key={perfil}>
                            <Dropdown.Header className={styles.perfil}>{rotulo}</Dropdown.Header>

                            {usuariosDoPerfil.map((item) => {
                                const atual = item.id === usuario.id;

                                return (
                                    <Dropdown.Item
                                        key={item.chave}
                                        as="button"
                                        type="button"
                                        className={styles.item}
                                        data-atual={atual}
                                        aria-current={atual || undefined}
                                        disabled={atual || trocandoPara !== null}
                                        onClick={() => trocar(item.chave)}
                                    >
                                        <span className={styles.usuario}>
                                            {item.nome}
                                            <small className={styles.descricao}>{item.descricao}</small>
                                        </span>
                                        {atual && <Check size={16} aria-hidden="true" />}
                                        {trocandoPara === item.chave && <Spinner animation="border" size="sm" />}
                                    </Dropdown.Item>
                                );
                            })}
                        </Fragment>
                    );
                })}

                {erro && <p className={styles.erro} role="alert">{erro}</p>}
            </Dropdown.Menu>
        </Dropdown>
    );
}

export default VisualizarComo;
