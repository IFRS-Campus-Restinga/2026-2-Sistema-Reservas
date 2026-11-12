import axios from 'axios';

const DEMONSTRACAO_URL = '/session/demonstracao/';

export const listarUsuariosDemonstracao = async () => {
    const response = await axios.get(DEMONSTRACAO_URL, { withCredentials: true });
    return response.data;
};

export const entrarComoUsuarioDemonstracao = async (chave) => {
    try {
        await axios.post(`${DEMONSTRACAO_URL}${chave}/`, null, { withCredentials: true });
    } catch (erro) {
        console.error('Erro ao entrar como usuário de demonstração:', erro.response?.data);
        throw erro;
    }
};
