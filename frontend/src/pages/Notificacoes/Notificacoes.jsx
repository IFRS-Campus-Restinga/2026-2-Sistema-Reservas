import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUsuario } from "../../hooks/useUsuario";
import {
  configuracaoNotificacao,
  notificacaoAbreSolicitacao,
} from "../../utils/notificacoes";
import { Check } from "lucide-react";

import {
  listarNotificacoes,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
} from "../../services";

import ModalNotificacao from "../../components/Notificacoes/ModalNotificacao";

import styles from "./Notificacoes.module.css";

function formatarTempo(dataHora) {
  if (!dataHora) return "";

  const data = new Date(dataHora);
  const agora = new Date();

  const minutos = Math.max(
    0,
    Math.floor((agora - data) / 60000)
  );

  if (minutos < 1) {
    return "Agora";
  }

  if (minutos < 60) {
    return `${minutos} min atrás`;
  }

  const horas = Math.floor(minutos / 60);

  if (horas < 24) {
    return `${horas} ${
      horas === 1 ? "hora" : "horas"
    } atrás`;
  }

  const dias = Math.floor(horas / 24);

  if (dias < 30) {
    return `${dias} ${
      dias === 1 ? "dia" : "dias"
    } atrás`;
  }

  return data.toLocaleDateString("pt-BR");
}


function avisarAtualizacao() {
  window.dispatchEvent(
    new Event("notificacoes-atualizadas")
  );
}


function Notificacoes() {
  const navigate = useNavigate();
  const usuario = useUsuario();

  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [selecionada, setSelecionada] =
    useState(null);


  useEffect(() => {
    carregarNotificacoes();
  }, []);


  async function carregarNotificacoes() {
    try {
      setCarregando(true);
      setErro("");

      const dados = await listarNotificacoes();

      setNotificacoes(dados.notificacoes || []);
      setNaoLidas(dados.nao_lidas || 0);
    } catch (falha) {
      setErro(
        falha.message ||
          "Não foi possível carregar as notificações."
      );
    } finally {
      setCarregando(false);
    }
  }


  async function abrirNotificacao(notificacao) {
    let atualizada = notificacao;

    if (!notificacao.lida) {
      try {
        atualizada =
          await marcarNotificacaoComoLida(
            notificacao.id
          );

        setNotificacoes((atuais) =>
          atuais.map((item) =>
            item.id === atualizada.id
              ? atualizada
              : item
          )
        );

        setNaoLidas((quantidade) =>
          Math.max(0, quantidade - 1)
        );

        avisarAtualizacao();
      } catch (falha) {
        console.error(falha);
      }
    }

  if (
    notificacaoAbreSolicitacao(
      atualizada,
      usuario
    )
  ) {
    navigate("/admin", {
      state: {
        aba: "solicitacoes",
        solicitacaoInicial: {
          id: atualizada.reserva.id,
          modalidade:
            atualizada.reserva.modalidade,
          termo_tipo: "responsabilidade",
        },
      },
    });

    return;
  }

    setSelecionada(atualizada);
  }


  async function marcarTodasComoLidas() {
    if (naoLidas === 0) return;

    try {
      await marcarTodasNotificacoesComoLidas();

      setNotificacoes((atuais) =>
        atuais.map((notificacao) => ({
          ...notificacao,
          lida: true,
        }))
      );

      setNaoLidas(0);

      avisarAtualizacao();
    } catch (falha) {
      setErro(
        falha.message ||
          "Não foi possível marcar as notificações como lidas."
      );
    }
  }


  return (
    <section className={styles.pagina}>
      <div className={styles.container}>
        <header className={styles.cabecalho}>
          <div>
            <h2>Notificações</h2>

            <span>
              {naoLidas}{" "}
              {naoLidas === 1
                ? "não lida"
                : "não lidas"}
            </span>
          </div>

          {naoLidas > 0 && (
            <button
              type="button"
              className={styles.marcarTodas}
              onClick={marcarTodasComoLidas}
            >
              <Check size={15} />

              Marcar todas como lidas
            </button>
          )}
        </header>


        {erro && (
          <p className={styles.erro}>
            {erro}
          </p>
        )}


        {carregando ? (
          <p className={styles.estado}>
            Carregando notificações...
          </p>
        ) : notificacoes.length === 0 ? (
          <p className={styles.estado}>
            Nenhuma notificação por enquanto.
          </p>
        ) : (
          <div className={styles.lista}>
            {notificacoes.map((notificacao) => {
              const { Icone, classe } =
                configuracaoNotificacao(
                  notificacao.tipo
                );

              return (
                <button
                  key={notificacao.id}
                  type="button"
                  className={`${styles.card} ${
                    !notificacao.lida
                      ? styles.naoLida
                      : ""
                  }`}
                  onClick={() =>
                    abrirNotificacao(notificacao)
                  }
                >
                  <span
                    className={`${styles.icone} ${styles[classe]}`}
                  >
                    <Icone size={17} />
                  </span>

                  <span className={styles.conteudo}>
                    <strong>
                      {notificacao.titulo}
                    </strong>

                    <span>
                      {notificacao.mensagem}
                    </span>

                    <small>
                      {formatarTempo(
                        notificacao.criada_em
                      )}
                    </small>
                  </span>

                  {!notificacao.lida && (
                    <span
                      className={styles.indicador}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>


      <ModalNotificacao
        notificacao={selecionada}
        aoFechar={() => setSelecionada(null)}
      />
    </section>
  );
}


export default Notificacoes;