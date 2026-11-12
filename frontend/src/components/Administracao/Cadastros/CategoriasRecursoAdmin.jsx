import CadastroSimples from './CadastroSimples/CadastroSimples';
import { criarCategoriaRecurso, atualizarCategoriaRecurso, excluirCategoriaRecurso } from '../../../services';
import { CATEGORIA_RECURSO_ICONE, CATEGORIA_RECURSO_LABEL, ICONE_CATEGORIA_PADRAO } from '../../../utils/categoriaRecurso';

// Os ícones vêm do enum IconeCategoria do backend
const ICONES = Object.entries(CATEGORIA_RECURSO_LABEL).map(([valor, rotulo]) => ({ valor, rotulo }));

const CAMPOS = [
    { nome: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true, maxLength: 50, placeholder: 'Ex.: Laboratório' },
    { nome: 'icone', rotulo: 'Ícone no catálogo', tipo: 'select', obrigatorio: true, opcoes: ICONES, padrao: 'OUTROS' },
];

const COLUNAS = [
    {
        chave: 'icone',
        titulo: 'Ícone',
        renderizar: (categoria) => {
            const Icone = CATEGORIA_RECURSO_ICONE[categoria.icone] ?? ICONE_CATEGORIA_PADRAO;
            return <Icone size={16} aria-label={CATEGORIA_RECURSO_LABEL[categoria.icone]} />;
        },
    },
    { chave: 'nome', titulo: 'Nome', campo: 'nome' },
    { chave: 'total_tipos', titulo: 'Tipos vinculados', campo: 'total_tipos' },
];

function CategoriasRecursoAdmin() {
    return (
        <CadastroSimples
            url="/api/categorias-recurso/"
            titulo="categoria"
            campos={CAMPOS}
            colunas={COLUNAS}
            servico={{ criar: criarCategoriaRecurso, atualizar: atualizarCategoriaRecurso, excluir: excluirCategoriaRecurso }}
            descreverItem={(categoria) => categoria.nome}
            placeholderBusca="Buscar categoria..."
        />
    );
}

export default CategoriasRecursoAdmin;
