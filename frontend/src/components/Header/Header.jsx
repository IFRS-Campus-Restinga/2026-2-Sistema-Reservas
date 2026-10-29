import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import { Bell, LogIn } from "lucide-react";

import styles from "./Header.module.css";

import NovaReserva from "./NovaReserva/NovaReserva";
import VisualizarComo from "./VisualizarComo/VisualizarComo";
import Botao from "../Botao/Botao";

import { PAPEL_USUARIO_LABEL } from "../../utils/usuario";
import { HUB_URL } from "../../config/hub";

import ModalNotificacao from "../Notificacoes/ModalNotificacao";

import { useNotificacoes } from "../../hooks/useNotificacoes";

import {
  configuracaoNotificacao,
  notificacaoAbreSolicitacao,
} from "../../utils/notificacoes";


function iniciaisDoNome(nome) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join("");
}


function formatarDataHora(dataHora) {
  if (!dataHora) return "";

  return new Date(dataHora).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function Header({ titulo, usuario }) {
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);

  const [notificacaoSelecionada, setNotificacaoSelecionada] =
    useState(null);

  const containerNotificacoesRef = useRef(null);

  const navigate = useNavigate();

  const {
    notificacoes,
    naoLidas,
    carregando: carregandoNotificacoes,
    erro: erroNotificacoes,
    marcarComoLida,
    marcarTodasComoLidas,
  } = useNotificacoes();

  useEffect(() => {
    function fecharAoClicarFora(evento) {
      if (
        containerNotificacoesRef.current &&
        !containerNotificacoesRef.current.contains(evento.target)
      ) {
        setNotificacoesAbertas(false);
      }
    }


    function fecharComEsc(evento) {
      if (evento.key === "Escape") {
        setNotificacoesAbertas(false);
      }
    }


    document.addEventListener("mousedown", fecharAoClicarFora);
    document.addEventListener("keydown", fecharComEsc);

    return () => {
      document.removeEventListener("mousedown", fecharAoClicarFora);
      document.removeEventListener("keydown", fecharComEsc);
    };
  }, []);


  function alternarNotificacoes() {
    setNotificacoesAbertas(
      (abertas) => !abertas
    );
  }


  async function abrirNotificacao(notificacao) {
    setNotificacoesAbertas(false);

    let atualizada = notificacao;

    if (!notificacao.lida) {
      try {
        atualizada = await marcarComoLida(
          notificacao.id
        );
      } catch (erro) {
        console.error(erro);
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
            termo_tipo:
              atualizada.reserva.termo_tipo ||
              "responsabilidade",
          },
        },
      });

      return;
    }

    setNotificacaoSelecionada(atualizada);
  }

  async function marcarTodas() {
    if (naoLidas === 0) return;

    try {
      await marcarTodasComoLidas();
    } catch (erro) {
      console.error(erro);
    }
  }


  const blocoPerfil = usuario && (
    <div className="d-flex align-items-center gap-2">
      <div className="d-none d-sm-flex flex-column align-items-end">
        <p className="mb-0 small fw-semibold text-dark">
          {usuario.nome}
        </p>

        <p
          className={`mb-0 small ${styles.perfilUsuario}`}
        >
          {PAPEL_USUARIO_LABEL[
            usuario.papel
          ] ?? usuario.papel}
        </p>
      </div>


      <div
        className={`d-flex align-items-center justify-content-center rounded-circle text-white fw-semibold small ${styles.avatar}`}
      >
        {iniciaisDoNome(usuario.nome)}
      </div>
    </div>
  );

  return (
    <>
      <header
        className={`d-flex align-items-center justify-content-between gap-2 flex-shrink-0 bg-white border-bottom px-3 px-md-4 ${styles.header}`}
      >
        {/* Título */}
        <div
          className={`d-flex flex-column overflow-hidden ${styles.titulos}`}
        >
          <h2 className="h5 mb-0 text-truncate">
            {titulo}
          </h2>

          <p className="mb-0 small text-secondary text-truncate">
            Campus Restinga, IFRS
          </p>
        </div>


        {/* Ações */}
        <div className="d-flex align-items-center gap-2 flex-shrink-0">

          {/* Nova reserva */}
          <NovaReserva usuario={usuario} />


          {/* Visitante */}
          {!usuario && (
            <Botao
              titulo="Entrar"
              icone={LogIn}
              aoClicar={() => (window.location.href = HUB_URL)}
            />
          )}


          {/* Notificações */}
          {usuario && (
            <div
              className="position-relative"
              ref={containerNotificacoesRef}
            >
              <Button
                type="button"
                variant="light"
                className={`position-relative d-flex align-items-center justify-content-center border-0 p-2 ${styles.botaoNotificacao}`}
                aria-label={
                  naoLidas
                    ? `Notificações: ${naoLidas} não lida${
                        naoLidas === 1 ? "" : "s"
                      }`
                    : "Notificações"
                }
                aria-expanded={notificacoesAbertas}
                aria-haspopup="menu"
                onClick={alternarNotificacoes}
              >
                <Bell size={18} />

                {naoLidas > 0 && (
                  <span
                    className={styles.contadorNotificacoes}
                  >
                    {naoLidas > 9 ? "9+" : naoLidas}
                  </span>
                )}
              </Button>


              {notificacoesAbertas && (
                <div
                  className={styles.menuNotificacoes}
                  role="menu"
                >
                  <div
                    className={styles.cabecalhoNotificacoes}
                  >
                    <strong>Notificações</strong>

                    {naoLidas > 0 && (
                      <button
                        type="button"
                        className={styles.marcarTodasLidas}
                        onClick={marcarTodas}
                      >
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>


                  <div
                    className={styles.listaNotificacoes}
                  >
                    {carregandoNotificacoes ? (
                      <p
                        className={
                          styles.estadoNotificacoes
                        }
                      >
                        Carregando...
                      </p>
                    ) : erroNotificacoes ? (
                      <p
                        className={`${styles.estadoNotificacoes} ${styles.erroNotificacoes}`}
                      >
                        {erroNotificacoes}
                      </p>
                    ) : notificacoes.length === 0 ? (
                      <p
                        className={
                          styles.estadoNotificacoes
                        }
                      >
                        Nenhuma notificação por enquanto.
                      </p>
                    ) : (
                      notificacoes.map((notificacao) => {
                        const { Icone, classe } =
                          configuracaoNotificacao(
                            notificacao.tipo
                          );

                        return (
                          <button
                            type="button"
                            role="menuitem"
                            key={notificacao.id}
                            className={`${styles.itemNotificacao} ${
                              notificacao.lida
                                ? ""
                                : styles.naoLida
                            }`}
                            onClick={() =>
                              abrirNotificacao(notificacao)
                            }
                          >
                            <span
                              className={`${styles.iconeNotificacao} ${styles[classe]}`}
                            >
                              <Icone size={16} />
                            </span>

                            <span
                              className={styles.conteudoNotificacao}
                            >
                              <strong>
                                {notificacao.titulo}
                              </strong>

                              <span>
                                {notificacao.mensagem}
                              </span>

                              <small>
                                {formatarDataHora(
                                  notificacao.criada_em
                                )}
                              </small>
                            </span>

                            {!notificacao.lida && (
                              <span
                                className={styles.indicadorLeitura}
                              />
                            )}
                          </button>
                        );
                      }))
                    }
                  </div>
                  {notificacoes.length > 0 && (
                    <button
                      type="button"
                      className={styles.verTodasNotificacoes}
                      onClick={() => {
                        setNotificacoesAbertas(false);
                        navigate("/notificacoes");
                      }}
                    >
                      Ver todas as notificações →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Perfil */}
          {usuario && (
            <VisualizarComo usuario={usuario}>
              {blocoPerfil}
            </VisualizarComo>
          )}
        </div>
      </header>


      <ModalNotificacao
        notificacao={notificacaoSelecionada}
        aoFechar={() =>
          setNotificacaoSelecionada(null)
        }
      />
    </>
  );
}


export default Header;
