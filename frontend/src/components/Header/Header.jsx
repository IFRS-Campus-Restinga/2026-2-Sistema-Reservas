import useListaPaginada from '../../hooks/useListaPaginada';
import Paginacao from '../Administracao/Paginacao/Paginacao';
import { useEffect, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import { Bell, Box, Building2, Car, ChevronDown, Plus } from "lucide-react";

import styles from "./Header.module.css";

import { PAPEL_USUARIO_LABEL } from "../../utils/usuario";

import { marcarNotificacaoComoLida } from "../../services";

import ModalNotificacao from "../Notificacoes/ModalNotificacao";


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


function Header({
  titulo,
  usuario,
  aoReservarEspaco,
  aoReservarVeiculo,
  aoReservarRecursoGeral,
}) {
  const [menuReservaAberto, setMenuReservaAberto] = useState(false);

  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  const consultaNotificacoes = useListaPaginada('/api/notificacoes/', {}, Boolean(usuario));
  const notificacoes = consultaNotificacoes.itens;
  const naoLidas = consultaNotificacoes.dados?.nao_lidas ?? 0;
  const carregandoNotificacoes = consultaNotificacoes.carregando;
  const erroNotificacoes = consultaNotificacoes.erro;
  const carregarNotificacoes = consultaNotificacoes.recarregar;

  const [notificacaoSelecionada, setNotificacaoSelecionada] =
    useState(null);

  const containerReservaRef = useRef(null);
  const containerNotificacoesRef = useRef(null);


  useEffect(() => {
    function fecharAoClicarFora(evento) {
      if (
        containerReservaRef.current &&
        !containerReservaRef.current.contains(evento.target)
      ) {
        setMenuReservaAberto(false);
      }

      if (
        containerNotificacoesRef.current &&
        !containerNotificacoesRef.current.contains(evento.target)
      ) {
        setNotificacoesAbertas(false);
      }
    }


    function fecharComEsc(evento) {
      if (evento.key === "Escape") {
        setMenuReservaAberto(false);
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


  function escolherReserva(acao) {
    setMenuReservaAberto(false);
    acao?.();
  }


  async function alternarNotificacoes() {
    const vaiAbrir = !notificacoesAbertas;

    setMenuReservaAberto(false);
    setNotificacoesAbertas(vaiAbrir);

    if (vaiAbrir) {
      await carregarNotificacoes();
    }
  }


  async function abrirNotificacao(notificacao) {
    setNotificacaoSelecionada(notificacao);
    setNotificacoesAbertas(false);

    if (notificacao.lida) return;

    try {
      const atualizada = await marcarNotificacaoComoLida(
        notificacao.id
      );

      setNotificacaoSelecionada(atualizada);

      carregarNotificacoes();
    } catch (erro) {
      console.error(erro);
    }
  }


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
          <div
            className="position-relative"
            ref={containerReservaRef}
          >
            <Button
              type="button"
              variant="success"
              size="sm"
              className="d-flex align-items-center gap-2 px-3"
              onClick={() =>
                setMenuReservaAberto((aberto) => !aberto)
              }
              aria-expanded={menuReservaAberto}
              aria-haspopup="menu"
            >
              <Plus size={15} />

              <span>Nova reserva</span>

              <ChevronDown
                size={14}
                className={
                  menuReservaAberto
                    ? styles.setaAberta
                    : ""
                }
              />
            </Button>


            {menuReservaAberto && (
              <div
                className={styles.menuReserva}
                role="menu"
              >
                <button
                  type="button"
                  className={styles.itemReserva}
                  onClick={() =>
                    escolherReserva(aoReservarEspaco)
                  }
                  role="menuitem"
                >
                  <Building2 size={16} />

                  <span>Reservar espaço</span>
                </button>


                <button
                  type="button"
                  className={styles.itemReserva}
                  onClick={() =>
                    escolherReserva(aoReservarVeiculo)
                  }
                  role="menuitem"
                >
                  <Car size={16} />

                  <span>Reservar veículo</span>
                </button>


                <button
                  type="button"
                  className={styles.itemReserva}
                  onClick={() =>
                    escolherReserva(
                      aoReservarRecursoGeral
                    )
                  }
                  role="menuitem"
                >
                  <Box size={16} />

                  <span>Reservar recurso geral</span>
                </button>
              </div>
            )}
          </div>


          {/* Notificações */}
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
                    <span>
                      {naoLidas} não lida
                      {naoLidas === 1 ? "" : "s"}
                    </span>
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
                    notificacoes.map((notificacao) => (
                      <button
                        type="button"
                        role="menuitem"
                        key={notificacao.id}
                        className={`${
                          styles.itemNotificacao
                        } ${
                          notificacao.lida
                            ? ""
                            : styles.naoLida
                        }`}
                        onClick={() =>
                          abrirNotificacao(notificacao)
                        }
                      >
                        <span
                          className={
                            styles.indicadorLeitura
                          }
                        />

                        <span
                          className={
                            styles.conteudoNotificacao
                          }
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
                      </button>
                    ))
                  )}
                  <Paginacao {...consultaNotificacoes.paginacao} />
                </div>
              </div>
            )}
          </div>


          {/* Perfil */}
          {usuario && (
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