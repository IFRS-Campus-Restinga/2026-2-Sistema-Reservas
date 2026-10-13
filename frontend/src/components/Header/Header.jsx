import styles from "./Header.module.css";
import { Bell, Plus, Box, Building2, Car, ChevronDown } from "lucide-react";
import { PAPEL_USUARIO_LABEL } from "../../utils/usuario";
import { useCallback, useEffect, useRef, useState } from "react";
import {listarNotificacoes, marcarNotificacaoComoLida,} from "../../services";
import ModalNotificacao from "../Notificacoes/ModalNotificacao";
import { Button } from "react-bootstrap";
import { Bell } from "lucide-react";
import NovaReserva from "./NovaReserva/NovaReserva";
import { PAPEL_USUARIO_LABEL } from "../../utils/usuario";
import styles from "./Header.module.css";

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
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [carregandoNotificacoes, setCarregandoNotificacoes] = useState(false);
  const [erroNotificacoes, setErroNotificacoes] = useState("");
  const [notificacaoSelecionada, setNotificacaoSelecionada] = useState(null);
  const containerReservaRef = useRef(null);
  const containerNotificacoesRef = useRef(null);
  
  const carregarNotificacoes = useCallback(async () => {
      if (!usuario) return;
  
      try {
        setCarregandoNotificacoes(true);
        setErroNotificacoes("");
        const dados = await listarNotificacoes();
        setNotificacoes(dados.notificacoes || []);
        setNaoLidas(dados.nao_lidas || 0);
      } catch (erro) {
        setErroNotificacoes(
          erro.message || "Não foi possível carregar as notificações."
        );
      } finally {
        setCarregandoNotificacoes(false);
      }
    }, [usuario]);
  
    useEffect(() => {
      if (!usuario) return undefined;
  
      let ativo = true;
  
      listarNotificacoes()
        .then((dados) => {
          if (!ativo) return;
          setNotificacoes(dados.notificacoes || []);
          setNaoLidas(dados.nao_lidas || 0);
        })
        .catch((erro) => {
          if (!ativo) return;
          setErroNotificacoes(
            erro.message || "Não foi possível carregar as notificações."
          );
        });
  
      return () => {
        ativo = false;
      };
    }, [usuario]);
  
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
        const atualizada = await marcarNotificacaoComoLida(notificacao.id);
  
        setNotificacaoSelecionada(atualizada);
        setNotificacoes((atuais) =>
          atuais.map((item) =>
            item.id === atualizada.id ? atualizada : item
          )
        );
        setNaoLidas((quantidade) => Math.max(0, quantidade - 1));
      } catch (erro) {
        console.error(erro);
      }
    }

 return (
  <>
    <header className={styles.header}>
      <div className={styles.infoHeader}>
        <h2 className={styles.titulo}>{titulo}</h2>
        <p className={styles.subTitulo}> Campus Restinga, IFRS </p>
      </div>

      <div className={styles.acoes}>
        <div className={styles.relative} ref={containerReservaRef}>
          <button
            type="button"
            className={styles.botaNovaReserva}
            onClick={() => setMenuReservaAberto((aberto) => !aberto)}
            aria-expanded={menuReservaAberto}
            aria-haspopup="menu"
          >
            <Plus size={15} />
            <span>Nova reserva</span>
            <ChevronDown
              size={14}
              className={menuReservaAberto ? styles.setaAberta : ""}
            />
          </button>

          {menuReservaAberto && (
            <div className={styles.menuReserva} role="menu">
              <button
                type="button"
                className={styles.itemReserva}
                onClick={() => escolherReserva(aoReservarEspaco)}
                role="menuitem"
              >
                <Building2 size={16} />
                <span>Reservar espaço</span>
              </button>

              <button
                type="button"
                className={styles.itemReserva}
                onClick={() => escolherReserva(aoReservarVeiculo)}
                role="menuitem"
              >
                <Car size={16} />
                <span>Reservar veículo</span>
              </button>

              <button
                type="button"
                className={styles.itemReserva}
                onClick={() => escolherReserva(aoReservarRecursoGeral)}
                role="menuitem"
              >
                <Box size={16} />
                <span>Reservar recurso geral</span>
              </button>
            </div>
          )}
        </div>
        <div className={styles.relative} ref={containerNotificacoesRef}>
          <button
            type="button"
            className={styles.botaoNotificacao}
            aria-label={
                naoLidas
                  ? `Notificações: ${naoLidas} não lida${naoLidas === 1 ? "" : "s"}`
                  : "Notificações"
              }
              aria-expanded={notificacoesAbertas}
              aria-haspopup="menu"
              onClick={alternarNotificacoes}
            >
            <Bell size={18} />
            {naoLidas > 0 && (
              <span className={styles.contadorNotificacoes}>
                {naoLidas > 9 ? "9+" : naoLidas}
              </span>
            )}
          </button>
           {notificacoesAbertas && (
              <div className={styles.menuNotificacoes} role="menu">
                <div className={styles.cabecalhoNotificacoes}>
                <strong>Notificações</strong>
                  {naoLidas > 0 && (
                    <span>{naoLidas} não lida{naoLidas === 1 ? "" : "s"}</span>
                  )}
                </div>
          
                <div className={styles.listaNotificacoes}>
                  {carregandoNotificacoes ? (
                    <p className={styles.estadoNotificacoes}>Carregando...</p>
                  ) : erroNotificacoes ? (
                    <p className={`${styles.estadoNotificacoes} ${styles.erroNotificacoes}`}>
                      {erroNotificacoes}
                              </p>
                            ) : notificacoes.length === 0 ? (
                              <p className={styles.estadoNotificacoes}>
                                Nenhuma notificação por enquanto.
                              </p>
                            ) : (
                              notificacoes.map((notificacao) => (
                                <button
                                  type="button"
                                  role="menuitem"
                                  key={notificacao.id}
                                  className={`${styles.itemNotificacao} ${
                                    notificacao.lida ? "" : styles.naoLida
                                  }`}
                                  onClick={() => abrirNotificacao(notificacao)}
                                >
                                  <span className={styles.indicadorLeitura} />
                                  <span className={styles.conteudoNotificacao}>
                                    <strong>{notificacao.titulo}</strong>
                                    <span>{notificacao.mensagem}</span>
                                    <small>{formatarDataHora(notificacao.criada_em)}</small>
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
        </div>
function Header({ titulo, usuario }) {
  return (
    <header
      className={`d-flex align-items-center justify-content-between gap-2 flex-shrink-0 bg-white border-bottom px-3 px-md-4 ${styles.header}`}
    >
      <div className={styles.titulos}>
        <h2 className="h5 m-0 fw-semibold text-truncate">{titulo}</h2>
        <p className="d-none d-sm-block m-0 small text-muted">
          Campus Restinga, IFRS
        </p>
      </div>

      <div className="d-flex align-items-center gap-2 flex-shrink-0">
        {usuario && <NovaReserva usuario={usuario} />}

        <Button
          variant="light"
          className={`d-flex p-2 border-0 rounded-3 text-secondary ${styles.botaoNotificacao}`}
          aria-label="Notificações"
        >
          <Bell size={18} />
        </Button>

        {usuario && (
          <div className="d-flex align-items-center gap-2 ps-2 border-start">
            <div className="d-none d-md-block text-end lh-sm">
              <p className="m-0 small fw-semibold text-capitalize">
                {usuario.nome}
              </p>
              <p className={`m-0 small ${styles.perfilUsuario}`}>
                {PAPEL_USUARIO_LABEL[usuario.papel] ?? usuario.papel}
              </p>
            </div>

            <div
              className={`d-flex align-items-center justify-content-center rounded-circle text-white fw-bold small ${styles.avatar}`}
            >
              {iniciaisDoNome(usuario.nome)}
            </div>
          </div>
        )}
      </div>
    </header>
    <ModalNotificacao
      notificacao={notificacaoSelecionada}
      aoFechar={() => setNotificacaoSelecionada(null)}
    />
    </>
  );
}

export default Header;
