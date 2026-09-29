import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Col, Row } from 'react-bootstrap';
import { Search } from 'lucide-react';

import CampoBusca from '../../components/Administracao/CampoBusca/CampoBusca';
import CardVeiculo from '../../components/CardVeiculo/CardVeiculo';
import Select from '../../components/Select/Select';
import { buscarVeiculos } from '../../services';
import styles from './Veiculos.module.css';

const OPCOES_STATUS = [
  { valor: 'ATIVO', rotulo: 'Ativos' },
  { valor: 'MANUTENCAO', rotulo: 'Em manutenção' },
  { valor: 'INATIVO', rotulo: 'Inativos' },
];

function Veiculos() {
  const navigate = useNavigate();
  const [veiculos, setVeiculos] = useState([]);
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('todos');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    buscarVeiculos()
      .then((dados) => {
        setVeiculos(dados);
        setErro('');
      })
      .catch(() => setErro('Não foi possível carregar os veículos.'))
      .finally(() => setCarregando(false));
  }, []);

  const termo = busca.trim().toLowerCase();
  const filtrados = veiculos.filter((veiculo) => {
    const texto = `${veiculo.nome} ${veiculo.marca} ${veiculo.modelo} ${veiculo.placa}`.toLowerCase();
    return texto.includes(termo) && (status === 'todos' || veiculo.status === status);
  });

  return (
    <div className="d-flex flex-column gap-4 p-3 p-md-4">
      <div className="d-flex flex-wrap align-items-center justify-content-center gap-2">
        <CampoBusca valor={busca} aoAlterar={setBusca} placeholder="Buscar veículo" />
        <Select valor={status} aoAlterar={setStatus} opcoes={OPCOES_STATUS}
          valorTodos="todos" rotuloTodos="Todos os status" ariaLabel="Filtrar por status" />
      </div>

      {erro && <p className="text-danger" role="alert">{erro}</p>}
      {carregando ? (
        <p className="text-muted" role="status">Carregando veículos...</p>
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
    </div>
  );
}

export default Veiculos;
