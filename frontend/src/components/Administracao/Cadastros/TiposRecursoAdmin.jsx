import CadastroSimples from './CadastroSimples/CadastroSimples';
import { criarTipoRecurso, atualizarTipoRecurso, excluirTipoRecurso } from '../../../services';

// Valores do enum CategoriaRecurso do backend
const CATEGORIAS = [
    { valor: 'TECNOLOGIA', rotulo: 'Tecnologia e audiovisual' },
    { valor: 'ESPORTES', rotulo: 'Materiais esportivos' },
    { valor: 'MANUTENCAO', rotulo: 'Manutenção' },
    { valor: 'APOIO', rotulo: 'Materiais de apoio' },
    { valor: 'OUTROS', rotulo: 'Outros' },
];

const CAMPOS = [
    { nome: 'descricao', rotulo: 'Descrição', tipo: 'texto', obrigatorio: true, maxLength: 50, placeholder: 'Ex.: Notebooks' },
    { nome: 'categoria', rotulo: 'Categoria', tipo: 'select', obrigatorio: true, opcoes: CATEGORIAS, padrao: 'OUTROS' },
];

const COLUNAS = [
    { chave: 'descricao', titulo: 'Descrição', campo: 'descricao' },
    {
        chave: 'categoria',
        titulo: 'Categoria',
        renderizar: (tipo) => CATEGORIAS.find((c) => c.valor === tipo.categoria)?.rotulo ?? tipo.categoria,
    },
];

function TiposRecursoAdmin() {
    return (
        <CadastroSimples
            url="/api/tipos-recurso/"
            titulo="tipo de recurso"
            campos={CAMPOS}
            colunas={COLUNAS}
            servico={{ criar: criarTipoRecurso, atualizar: atualizarTipoRecurso, excluir: excluirTipoRecurso }}
            descreverItem={(tipo) => tipo.descricao}
            placeholderBusca="Buscar tipo de recurso..."
        />
    );
}

export default TiposRecursoAdmin;
