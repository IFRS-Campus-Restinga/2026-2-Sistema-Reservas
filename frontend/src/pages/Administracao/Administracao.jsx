import { useEffect, useState } from 'react'
import { Eye, Pencil, Plus, Search, Shield, Trash2, X } from 'lucide-react'
import {
  atualizarRecursoGeral,
  criarRecursoGeral,
  excluirRecursoGeral,
  listarRecursosGerais,
  listarTiposRecurso,
} from '../../services'
import styles from './Administracao.module.css'

const FORM_INICIAL = {
  nome: '',
  tipo_recurso: '',
  codigo: '',
  tipo_prazo: 'CURTO_PRAZO',
  quantidade_total: 1,
  tem_termo_de_responsabilidade: false,
  observacao: '',
  status: 'ATIVO',
}

const STATUS_LABEL = {
  ATIVO: 'Ativo',
  MANUTENCAO: 'Manutenção',
  INATIVO: 'Inativo',
}

function Administracao() {
  const [recursos, setRecursos] = useState([])
  const [tipos, setTipos] = useState([])
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [recursoEditando, setRecursoEditando] = useState(null)
  const [form, setForm] = useState(FORM_INICIAL)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function carregarDados() {
    try {
      const listaRecursos = await listarRecursosGerais()
      const listaTipos = await listarTiposRecurso()

      setRecursos(listaRecursos)
      setTipos(listaTipos)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const tiposPorId = {}
  tipos.forEach((tipo) => {
    tiposPorId[tipo.id] = tipo.descricao
  })

  const textoBusca = busca.trim().toLowerCase()
  const recursosFiltrados = recursos.filter((recurso) => {
    if (!textoBusca) {
      return true
    }

    const categoria = tiposPorId[recurso.tipo_recurso] || ''

    return (
      recurso.nome.toLowerCase().includes(textoBusca) ||
      categoria.toLowerCase().includes(textoBusca) ||
      (recurso.codigo || '').toLowerCase().includes(textoBusca)
    )
  })

  function abrirAdicionar() {
    setRecursoEditando(null)
    setForm({
      ...FORM_INICIAL,
      tipo_recurso: tipos[0]?.id || '',
    })
    setErro('')
    setModalAberto(true)
  }

  function abrirEditar(recurso) {
    setRecursoEditando(recurso)
    setForm({
      nome: recurso.nome,
      tipo_recurso: recurso.tipo_recurso,
      codigo: recurso.codigo || '',
      tipo_prazo: recurso.tipo_prazo,
      quantidade_total: recurso.quantidade_total,
      tem_termo_de_responsabilidade: recurso.tem_termo_de_responsabilidade,
      observacao: recurso.observacao || '',
      status: recurso.status,
    })
    setErro('')
    setModalAberto(true)
  }

  function fecharModal() {
    if (!salvando) {
      setModalAberto(false)
      setRecursoEditando(null)
    }
  }

  function alterarCampo(event) {
    const { name, value, type, checked } = event.target

    setForm((anterior) => ({
      ...anterior,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function salvarRecurso(event) {
    event.preventDefault()
    setSalvando(true)
    setErro('')

    const dados = {
      ...form,
      tipo_recurso: Number(form.tipo_recurso),
      quantidade_total: Number(form.quantidade_total),
    }

    try {
      if (recursoEditando) {
        await atualizarRecursoGeral(recursoEditando.id, dados)
      } else {
        await criarRecursoGeral({
          ...dados,
          quantidade_reservada: 0,
        })
      }

      setModalAberto(false)
      setRecursoEditando(null)
      await carregarDados()
    } catch (e) {
      const dadosErro = e.dados || {}
      const primeiraMensagem = Object.values(dadosErro).flat()[0]
      setErro(primeiraMensagem || e.message)
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(recurso) {
    const confirmou = window.confirm(`Deseja excluir o recurso "${recurso.nome}"?`)

    if (!confirmou) {
      return
    }

    setErro('')

    try {
      await excluirRecursoGeral(recurso.id)
      await carregarDados()
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.faixaAdmin}>
        <Shield size={15} />
        <span>Painel administrativo · acesso restrito</span>
      </div>

      <div className={styles.abas}>
        <button type="button" className={styles.abaAtiva}>Recursos</button>
      </div>

      <section className={styles.conteudo}>
        <div className={styles.barraAcoes}>
          <div className={styles.busca}>
            <Search size={17} />
            <input
              type="text"
              placeholder="Buscar..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
          </div>

          <button
            type="button"
            className={styles.botaoAdicionar}
            onClick={abrirAdicionar}
            disabled={tipos.length === 0}
            title={tipos.length === 0 ? 'Cadastre um tipo de recurso primeiro' : undefined}
          >
            <Plus size={17} />
            Adicionar
          </button>
        </div>

        {erro && !modalAberto && (
          <div className={styles.mensagemErro}>{erro}</div>
        )}

        <div className={styles.tabelaContainer}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Recurso</th>
                <th>Categoria</th>
                <th>Disponibilidade</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan="5" className={styles.estadoTabela}>Carregando...</td>
                </tr>
              ) : recursosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className={styles.estadoTabela}>Nenhum recurso encontrado.</td>
                </tr>
              ) : (
                recursosFiltrados.map((recurso) => {
                  const disponiveis = Math.max(
                    0,
                    recurso.quantidade_total - recurso.quantidade_reservada,
                  )

                  return (
                    <tr key={recurso.id}>
                      <td>{recurso.nome}</td>
                      <td>{tiposPorId[recurso.tipo_recurso] || '-'}</td>
                      <td>{disponiveis}/{recurso.quantidade_total}</td>
                      <td>
                        <span className={`${styles.status} ${styles[`status${recurso.status}`] || ''}`}>
                          <Eye size={12} />
                          {STATUS_LABEL[recurso.status] || recurso.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.acoesLinha}>
                          <button
                            type="button"
                            onClick={() => abrirEditar(recurso)}
                            aria-label={`Editar ${recurso.nome}`}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => excluir(recurso)}
                            aria-label={`Excluir ${recurso.nome}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalAberto && (
        <div className={styles.fundoModal} onMouseDown={fecharModal}>
          <div className={styles.modal} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.cabecalhoModal}>
              <h3>{recursoEditando ? 'Editar recurso' : 'Adicionar recurso'}</h3>
              <button type="button" onClick={fecharModal} aria-label="Fechar">
                <X size={19} />
              </button>
            </div>

            <form onSubmit={salvarRecurso} className={styles.formulario}>
              <label className={styles.campoInteiro}>
                <span>Nome *</span>
                <input
                  name="nome"
                  type="text"
                  placeholder="Ex.: Notebook Dell Latitude"
                  maxLength="50"
                  minLength="3"
                  value={form.nome}
                  onChange={alterarCampo}
                  required
                />
              </label>

              <label>
                <span>Categoria</span>
                <select
                  name="tipo_recurso"
                  value={form.tipo_recurso}
                  onChange={alterarCampo}
                  required
                >
                  {tipos.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>{tipo.descricao}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Código</span>
                <input
                  name="codigo"
                  type="text"
                  placeholder="Opcional"
                  maxLength="50"
                  value={form.codigo}
                  onChange={alterarCampo}
                />
              </label>

              <label>
                <span>Prazo</span>
                <select name="tipo_prazo" value={form.tipo_prazo} onChange={alterarCampo}>
                  <option value="CURTO_PRAZO">Curto prazo</option>
                  <option value="LONGO_PRAZO">Longo prazo</option>
                </select>
              </label>

              <label>
                <span>Quantidade total</span>
                <input
                  name="quantidade_total"
                  type="number"
                  min="0"
                  value={form.quantidade_total}
                  onChange={alterarCampo}
                  required
                />
              </label>

              <label className={styles.campoInteiro}>
                <span>Observação</span>
                <textarea
                  name="observacao"
                  placeholder="Descreva o recurso..."
                  maxLength="50"
                  value={form.observacao}
                  onChange={alterarCampo}
                />
              </label>

              <label className={`${styles.campoInteiro} ${styles.checkbox}`}>
                <input
                  name="tem_termo_de_responsabilidade"
                  type="checkbox"
                  checked={form.tem_termo_de_responsabilidade}
                  onChange={alterarCampo}
                />
                <span>Exige termo de responsabilidade</span>
              </label>

              <label className={styles.campoInteiro}>
                <span>Status</span>
                <select name="status" value={form.status} onChange={alterarCampo}>
                  <option value="ATIVO">Ativo</option>
                  <option value="MANUTENCAO">Manutenção</option>
                  <option value="INATIVO">Inativo</option>
                </select>
              </label>

              {erro && <div className={`${styles.mensagemErro} ${styles.campoInteiro}`}>{erro}</div>}

              <div className={`${styles.botoesModal} ${styles.campoInteiro}`}>
                <button type="button" className={styles.cancelar} onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className={styles.salvar} disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Administracao
