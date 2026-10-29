import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Dropdown } from 'react-bootstrap';
import { Box, Building2, Car, ChevronDown, Plus } from 'lucide-react';
import ReservaAreaModal from '../../ReservaArea/ReservaAreaModal';
import ReservaVeiculoModal from '../../ReservaVeiculo/ReservaVeiculoModal';
import ReservaRecursoGeralModal from '../../ReservaRecursoGeral/ReservaRecursoGeralModal';
import {
  buscarAreas,
  buscarBlocos,
  buscarVeiculos,
  listarRecursosGerais,
  listarTiposRecurso,
} from '../../../services';
import {
  podeReservarArea,
  podeReservarRecursoGeral,
  podeReservarVeiculo,
} from '../../../utils/permissoes';
import { TIPO_RECURSO_RESERVAVEL } from '../../../utils/tipoRecursoReservavel';
import styles from './NovaReserva.module.css';

/**
 * Botão "Nova reserva" do cabeçalho.
 * Mostra apenas os tipos de reserva que o usuário pode fazer:
 * nenhum tipo oculta o botão, um tipo executa a ação direto e
 * dois ou mais abrem um menu.
 *
 * Exemplo de uso:
 * <NovaReserva usuario={usuario} />
 *
 * Props:
 * - usuario: usuário logado (/session/me/)
 */

const OPCOES = [
  {
    tipo: TIPO_RECURSO_RESERVAVEL.AREA,
    rotulo: 'Reservar área',
    icone: Building2,
    permissao: podeReservarArea,
  },
  {
    tipo: TIPO_RECURSO_RESERVAVEL.VEICULO,
    rotulo: 'Reservar veículo',
    icone: Car,
    permissao: podeReservarVeiculo,
  },
  {
    tipo: TIPO_RECURSO_RESERVAVEL.RECURSO_GERAL,
    rotulo: 'Reservar recurso',
    icone: Box,
    permissao: podeReservarRecursoGeral,
  },
];

const recursoReservavel = (recurso) =>
  recurso.status === 'ATIVO' && Number(recurso.quantidade_total) > 0;

function NovaReserva({ usuario }) {
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  const opcoes = OPCOES.filter((opcao) => opcao.permissao(usuario));

  if (opcoes.length === 0) return null;


  async function abrir(opcao) {
    try {
      setCarregando(true);

      if (opcao.tipo === TIPO_RECURSO_RESERVAVEL.AREA) {
        const [areas, blocos] = await Promise.all([buscarAreas(), buscarBlocos()]);
        setModal({ tipo: opcao.tipo, areas, blocos });
        return;
      }

      if (opcao.tipo === TIPO_RECURSO_RESERVAVEL.VEICULO) {
        const veiculos = await buscarVeiculos();
        const veiculoInicial = veiculos.find((veiculo) => veiculo.status === 'ATIVO');

        if (!veiculoInicial) {
          console.error('Nenhum veículo ativo disponível para reserva.');
          return;
        }

        setModal({ tipo: opcao.tipo, veiculos, veiculoInicial });
        return;
      }

      const [recursos, tipos] = await Promise.all([
        listarRecursosGerais(),
        listarTiposRecurso(),
      ]);
      const recursoInicial = recursos.find(recursoReservavel);

      if (!recursoInicial) {
        console.error('Nenhum recurso disponível para reserva.');
        return;
      }

      setModal({ tipo: opcao.tipo, recursos, tipos, recursoInicial });
    } catch (falha) {
      console.error(falha);
    } finally {
      setCarregando(false);
    }
  }

  function concluir(estado) {
    setModal(null);
    navigate('/minhas-reservas', { state: estado });
  }

  return (
    <>
      {opcoes.length === 1 ? (
        <Button
          variant="success"
          size="sm"
          className={`d-flex align-items-center gap-2 px-2 px-sm-3 ${styles.botao}`}
          aria-label="Nova reserva"
          disabled={carregando}
          onClick={() => abrir(opcoes[0])}
        >
          <Plus size={15} />
          <span className="d-none d-sm-inline">Nova reserva</span>
        </Button>
      ) : (
        <Dropdown onToggle={setMenuAberto}>
          <Dropdown.Toggle
            variant="success"
            size="sm"
            className={`d-flex align-items-center gap-2 px-2 px-sm-3 ${styles.botao}`}
            aria-label="Nova reserva"
            disabled={carregando}
          >
            <Plus size={15} />
            <span className="d-none d-sm-inline">Nova reserva</span>
            <ChevronDown
              size={14}
              className={`d-none d-sm-block ${menuAberto ? styles.setaAberta : ''}`}
            />
          </Dropdown.Toggle>

          <Dropdown.Menu
            align="end"
            className={styles.menu}
            popperConfig={{
              modifiers: [{ name: 'offset', options: { offset: [0, 8] } }],
            }}
          >
            {opcoes.map((opcao) => {
              const Icone = opcao.icone;

              return (
                <Dropdown.Item
                  key={opcao.tipo}
                  as="button"
                  type="button"
                  className={`d-flex align-items-center ${styles.item}`}
                  onClick={() => abrir(opcao)}
                >
                  <Icone size={16} />
                  <span>{opcao.rotulo}</span>
                </Dropdown.Item>
              );
            })}
          </Dropdown.Menu>
        </Dropdown>
      )}

      {modal?.tipo === TIPO_RECURSO_RESERVAVEL.AREA && (
        <ReservaAreaModal
          aberto
          areaInicial={null}
          areas={modal.areas}
          blocos={modal.blocos}
          usuario={usuario}
          aoFechar={() => setModal(null)}
          aoReservar={() => concluir({ criada: true })}
        />
      )}

      {modal?.tipo === TIPO_RECURSO_RESERVAVEL.VEICULO && (
        <ReservaVeiculoModal
          aberto
          veiculoInicial={modal.veiculoInicial}
          veiculos={modal.veiculos}
          aoFechar={() => setModal(null)}
          aoReservar={() => concluir({ criada: true, tipo: 'veiculo' })}
        />
      )}

      {modal?.tipo === TIPO_RECURSO_RESERVAVEL.RECURSO_GERAL && (
        <ReservaRecursoGeralModal
          aberto
          tipos={modal.tipos}
          recursos={modal.recursos}
          recursoInicial={modal.recursoInicial}
          aoFechar={() => setModal(null)}
          aoReservar={() => concluir({ criada: true })}
        />
      )}
    </>
  );
}

export default NovaReserva;
