import { useState } from 'react';
import { Dropdown, Spinner } from 'react-bootstrap';
import { Check, ChevronDown } from 'lucide-react';

import { entrarComoPerfilDemonstracao } from '../../../services';
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

    if (!usuario?.modo_demonstracao) return children;

    async function trocar(perfil) {
        setTrocandoPara(perfil);
        setErro('');
        try {
            await entrarComoPerfilDemonstracao(perfil);
            window.location.assign('/');
        } catch {
            setErro('Não foi possível trocar de perfil.');
            setTrocandoPara(null);
        }
    }

    return (
        <Dropdown align="end" onToggle={setMenuAberto}>
            <Dropdown.Toggle
                as="button"
                type="button"
                className={styles.gatilho}
                aria-label="Visualizar como outro perfil"
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
                    <p className={styles.subtitulo}>Alternar perfil de demonstração do protótipo</p>
                </div>

                {PERFIS_DEMONSTRACAO.map(({ perfil, rotulo }) => {
                    const atual = usuario.papel === perfil;

                    return (
                        <Dropdown.Item
                            key={perfil}
                            as="button"
                            type="button"
                            className={styles.item}
                            data-atual={atual}
                            aria-current={atual || undefined}
                            disabled={atual || trocandoPara !== null}
                            onClick={() => trocar(perfil)}
                        >
                            {rotulo}
                            {atual && <Check size={16} aria-hidden="true" />}
                            {trocandoPara === perfil && <Spinner animation="border" size="sm" />}
                        </Dropdown.Item>
                    );
                })}

                {erro && <p className={styles.erro} role="alert">{erro}</p>}
            </Dropdown.Menu>
        </Dropdown>
    );
}

export default VisualizarComo;
