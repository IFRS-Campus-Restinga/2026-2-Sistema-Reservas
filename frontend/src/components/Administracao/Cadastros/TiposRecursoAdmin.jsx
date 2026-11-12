import CadastroSimples from './CadastroSimples/CadastroSimples';
import { criarTipoRecurso, atualizarTipoRecurso, excluirTipoRecurso } from '../../../services';

const CAMPOS = [
    { nome: 'descricao', rotulo: 'Descrição', tipo: 'texto', obrigatorio: true, maxLength: 50, placeholder: 'Ex.: Notebooks' },
    { nome: 'categoria', rotulo: 'Categoria', tipo: 'remoto', url: '/api/categorias-recurso/' },
];

const COLUNAS = [
    { chave: 'descricao', titulo: 'Descrição', campo: 'descricao' },
    { chave: 'categoria', titulo: 'Categoria', renderizar: (tipo) => tipo.categoria_nome ?? 'Sem categoria' },
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
