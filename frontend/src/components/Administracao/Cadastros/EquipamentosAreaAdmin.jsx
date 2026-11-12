import CadastroSimples from './CadastroSimples/CadastroSimples';
import { criarEquipamentoArea, atualizarEquipamentoArea, excluirEquipamentoArea } from '../../../services';

const CAMPOS = [
    { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true, maxLength: 50, placeholder: 'Ex.: Lousa digital' },
];

const COLUNAS = [
    { chave: 'nome', titulo: 'Nome', campo: 'nome' },
    { chave: 'total_areas', titulo: 'Áreas com o equipamento', campo: 'total_areas' },
];

function EquipamentosAreaAdmin() {
    return (
        <CadastroSimples
            url="/api/equipamentos-area/"
            titulo="equipamento"
            campos={CAMPOS}
            colunas={COLUNAS}
            servico={{ criar: criarEquipamentoArea, atualizar: atualizarEquipamentoArea, excluir: excluirEquipamentoArea }}
            descreverItem={(equipamento) => equipamento.nome}
            placeholderBusca="Buscar equipamento..."
        />
    );
}

export default EquipamentosAreaAdmin;
