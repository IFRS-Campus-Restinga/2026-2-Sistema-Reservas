import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Dropdown } from 'react-bootstrap';
import { Car, ChevronDown, DoorOpen, Package, Plus } from 'lucide-react';
import ReservaAreaModal from '../../ReservaArea/ReservaAreaModal';
import ReservaVeiculoModal from '../../ReservaVeiculo/ReservaVeiculoModal';
import { podeReservarArea, podeReservarRecursoGeral, podeReservarVeiculo } from '../../../utils/permissoes';
import { TIPO_RECURSO_RESERVAVEL } from '../../../utils/tipoRecursoReservavel';
import styles from './NovaReserva.module.css';

/**
 * Botão "Nova reserva" do cabeçalho.
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
    icone: DoorOpen,
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
    icone: Package,
    permissao: podeReservarRecursoGeral,
  },
];

function NovaReserva({ usuario }) {
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const carregando = false;

  const opcoes = OPCOES.filter((opcao) => opcao.permissao(usuario));

  if (opcoes.length === 0) return null;


  async function abrir(opcao) {
    if (opcao.tipo === TIPO_RECURSO_RESERVAVEL.RECURSO_GERAL) {
      navigate('/recursos');
      return;
    }

    setModal({ tipo: opcao.tipo });
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
          className={`d-flex align-items-center gap-2 fw-semibold px-2 px-sm-3 py-2 ${styles.botao}`}
          aria-label="Nova reserva"
          disabled={carregando}
          onClick={() => abrir(opcoes[0])}
        >
          <Plus size={15} />
          <span className="d-none d-sm-inline">Nova reserva</span>
        </Button>
      ) : (
        <Dropdown>
          <Dropdown.Toggle
            variant="success"
            className={`d-flex align-items-center gap-2 fw-semibold px-2 px-sm-3 py-2 ${styles.botao}`}
            aria-label="Nova reserva"
            disabled={carregando}
          >
            <Plus size={15} />
            <span className="d-none d-sm-inline">Nova reserva</span>
            <ChevronDown size={13} className="d-none d-sm-block" />
          </Dropdown.Toggle>

          <Dropdown.Menu align="end" className="py-1 border-0 rounded-3 shadow-lg">
            {opcoes.map((opcao) => {
              const Icone = opcao.icone;

              return (
                <Dropdown.Item
                  key={opcao.tipo}
                  as="button"
                  type="button"
                  className="d-flex align-items-center gap-2 px-3 py-2 small"
                  onClick={() => abrir(opcao)}
                >
                  <Icone size={15} className={styles.icone} />
                  {opcao.rotulo}
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
    </>
  );
}

export default NovaReserva;
