import axios from 'axios';

const DEMONSTRACAO_URL = '/session/demonstracao/';

export const entrarComoPerfilDemonstracao = async (perfil) => {
    try {
        await axios.post(`${DEMONSTRACAO_URL}${perfil}/`, null, { withCredentials: true });
    } catch (erro) {
        console.error('Erro ao entrar como perfil de demonstração:', erro.response?.data);
        throw erro;
    }
};
