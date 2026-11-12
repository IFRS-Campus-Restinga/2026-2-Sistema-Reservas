import useListaPaginada from '../../hooks/useListaPaginada';
import Paginacao from '../../components/Administracao/Paginacao/Paginacao';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Col, Row } from 'react-bootstrap';
import { Search } from 'lucide-react';

import CampoBusca from '../../components/Administracao/CampoBusca/CampoBusca';
import BarraFiltros from '../../components/BarraFiltros/BarraFiltros';
import CardVeiculo from '../../components/CardVeiculo/CardVeiculo';
import Select from '../../components/Select/Select';
import AlertBanner from '../../components/AlertBanner/AlertBanner';
import styles from './Veiculos.module.css';
import SkeletonCardLista from '../../components/Skeleton/SkeletonCardLista';

const OPCOES_STATUS = [
  { valor: 'ATIVO', rotulo: 'Ativos' },
  { valor: 'MANUTENCAO', rotulo: 'Em manutenção' },
  { valor: 'INATIVO', rotulo: 'Inativos' },
];

function Veiculos() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('todos');

  const { itens: filtrados, carregando, erro, paginacao } = useListaPaginada('/api/veiculos/', { busca, status });

  return (
    <div className="d-flex flex-column gap-4 p-3 p-md-4">
      <BarraFiltros>
        <CampoBusca valor={busca} aoAlterar={setBusca} placeholder="Buscar veículo" />
        <Select valor={status} aoAlterar={setStatus} opcoes={OPCOES_STATUS}
          valorTodos="todos" rotuloTodos="Todos os status" ariaLabel="Filtrar por status" />
      </BarraFiltros>

      <AlertBanner tipo="erro" mensagem={erro} />
      {carregando ? (
        <SkeletonCardLista rotulo="Carregando veículos..." />
      ) : filtrados.length === 0 ? (
        <div className={`text-center bg-white border rounded-3 py-5 px-3 text-muted ${styles.vazio}`}>
          <Search size={32} className="d-block mx-auto mb-2 opacity-25" />
          <p className="small mb-0">Nenhum veículo encontrado.</p>
        </div>
      ) : (
        <Row xs={1} sm={2} md={3} lg={4} className="g-3">
          {filtrados.map((veiculo) => (
            <Col key={veiculo.id}>
              <CardVeiculo veiculo={veiculo} aoClicar={() => navigate(`/veiculos/${veiculo.id}`)} />
            </Col>
          ))}
        </Row>
      )}
      <Paginacao {...paginacao} />
    </div>
  );
}

export default Veiculos;
