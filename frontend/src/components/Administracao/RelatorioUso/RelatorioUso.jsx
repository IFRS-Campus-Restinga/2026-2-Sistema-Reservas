import { useState } from 'react';
import { ChevronDown, FileText, Printer } from 'lucide-react';
import { useUsuario } from '../../../hooks/useUsuario';
import { ehAdministrador } from '../../../utils/permissoes';
import { gerarRelatorioUso } from '../../../services/relatorios';
import Modal from '../Modal/Modal';
import SelectRemoto from '../../SelectRemoto/SelectRemoto';
import styles from './RelatorioUso.module.css';

const ROTULOS = { area: 'Áreas', veiculo: 'Veículos', recurso_geral: 'Recursos Gerais', todas: 'Todos os Recursos' };
const STATUS = ['PENDENTE', 'AGUARDANDO_TERMO', 'CONFIRMADA', 'AGUARDANDO_TERMO_DEVOLUCAO', 'CONCLUIDA', 'CANCELADA', 'REJEITADA'];
const STATUS_LABEL = { PENDENTE: 'Pendente', AGUARDANDO_TERMO: 'Aguardando termo', CONFIRMADA: 'Confirmada', AGUARDANDO_TERMO_DEVOLUCAO: 'Aguardando termo de devolução', CONCLUIDA: 'Concluída', CANCELADA: 'Cancelada', REJEITADA: 'Rejeitada' };

function hoje() { const data = new Date(); return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`; }
function daquiUmMes() {
  const atual = new Date();
  const primeiroDiaAlvo = new Date(atual.getFullYear(), atual.getMonth() + 1, 1);
  const ultimoDiaAlvo = new Date(primeiroDiaAlvo.getFullYear(), primeiroDiaAlvo.getMonth() + 1, 0).getDate();
  const data = new Date(primeiroDiaAlvo.getFullYear(), primeiroDiaAlvo.getMonth(), Math.min(atual.getDate(), ultimoDiaAlvo));
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}
function dataPt(data) { return data ? new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR') : '—'; }
function hora(horario) { return horario?.slice(0, 5) || '—'; }
function horasPt(valor) { return Number(valor || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 }); }
function duracaoMedia(horas, reservas) {
  if (!reservas) return '0 min';
  const minutos = Math.round((horas / reservas) * 60);
  const parteHoras = Math.floor(minutos / 60);
  const parteMinutos = minutos % 60;
  return parteHoras ? `${parteHoras}h${String(parteMinutos).padStart(2, '0')}` : `${parteMinutos} min`;
}

function ResumoRelatorio({ relatorio }) {
  const resumo = relatorio.resumo;
  const maisUtilizado = relatorio.agrupamentos?.[0];
  return <section className={styles.panorama} aria-label="Resumo do relatório">
    <div className={styles.ocupacao}>
      <div className={styles.ocupacaoCabecalho}>
        <span>Ocupação geral</span>
        <strong>{resumo.taxa_ocupacao}%</strong>
      </div>
      <p>Foram utilizadas {horasPt(resumo.total_horas)} de {horasPt(resumo.horas_disponiveis)} horas disponíveis.</p>
    </div>
    <div className={styles.indicadores}>
      <div><strong>{resumo.total_reservas.toLocaleString('pt-BR')}</strong><span>Total de reservas</span></div>
      <div><strong>{duracaoMedia(resumo.total_horas, resumo.total_reservas)}</strong><span>Média por reserva</span></div>
      <div><strong>{maisUtilizado?.recurso || '—'}</strong><span>{maisUtilizado ? 'Recurso mais utilizado' : 'Sem utilização no período'}</span></div>
    </div>
  </section>;
}

export default function RelatorioUso() {
  const usuario = useUsuario();
  const [aberto, setAberto] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [modalidadeInicial, setModalidadeInicial] = useState('todas');
  const [filtros, setFiltros] = useState({
    modalidade: 'todas', data_inicio: hoje(), data_fim: daquiUmMes(),
    bloco: '', tipo_recurso: '', recurso: '', responsavel: '', status: '',
    incluir_canceladas: false,
  });
  const [relatorio, setRelatorio] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  if (!ehAdministrador(usuario)) return null;

  const modalidade = modalidadeInicial;
  function abrirRelatorio(novaModalidade) {
    setModalidadeInicial(novaModalidade);
    setFiltros((atual) => ({ ...atual, modalidade: novaModalidade, bloco: '', tipo_recurso: '', recurso: '' }));
    setRelatorio(null);
    setErro('');
    setMenuAberto(false);
    setAberto(true);
  }
  function alterar(campo, valor) {
    setFiltros((atual) => ({ ...atual, [campo]: valor,
      ...(['modalidade', 'bloco', 'tipo_recurso'].includes(campo) ? { recurso: '' } : {}) }));
    setRelatorio(null);
  }
  async function gerar(evento) {
    evento.preventDefault(); setErro(''); setCarregando(true);
    try { setRelatorio(await gerarRelatorioUso({ ...filtros, modalidade })); }
    catch (falha) { setErro(falha.message); }
    finally { setCarregando(false); }
  }

  return <>
    <div className={styles.dropdown}>
      <button type="button" className={styles.botaoDropdown} aria-expanded={menuAberto}
        onClick={() => setMenuAberto((valor) => !valor)}>
        <FileText size={16} /> Gerar relatório <ChevronDown size={15} />
      </button>
      {menuAberto && <div className={styles.menu} role="menu">
        <button type="button" onClick={() => abrirRelatorio('todas')}>Todos os recursos</button>
        <button type="button" onClick={() => abrirRelatorio('area')}>Áreas</button>
        <button type="button" onClick={() => abrirRelatorio('veiculo')}>Veículos</button>
        <button type="button" onClick={() => abrirRelatorio('recurso_geral')}>Recursos gerais</button>
      </div>}
    </div>
    <Modal aberto={aberto} titulo={`Relatório de ${ROTULOS[modalidadeInicial]}`}
      aoFechar={() => setAberto(false)} variante="relatorio" processando={carregando}>
      <div className={styles.conteudo}>
        <form className={styles.filtros} onSubmit={gerar}>
          <label>Data inicial<input type="date" required value={filtros.data_inicio} onChange={(e) => alterar('data_inicio', e.target.value)} /></label>
          <label>Data final<input type="date" required min={filtros.data_inicio} value={filtros.data_fim} onChange={(e) => alterar('data_fim', e.target.value)} /></label>
          {(modalidade === 'area') && <label>Bloco (opcional)<SelectRemoto url="/api/blocos/" mostrarBusca={false} filtros={{ page_size: 100 }} valor={filtros.bloco} aoAlterar={(v) => alterar('bloco', v)} rotuloTodos="Todos os blocos" /></label>}
          {(modalidade === 'recurso_geral') && <label>Tipo (opcional)<SelectRemoto url="/api/tipos-recurso/" mostrarBusca={false} filtros={{ page_size: 100 }} valor={filtros.tipo_recurso} aoAlterar={(v) => alterar('tipo_recurso', v)} rotuloTodos="Todos os tipos" /></label>}
          {modalidade !== 'todas' && <label>{modalidade === 'area' ? 'Área' : modalidade === 'veiculo' ? 'Veículo' : 'Item'} (opcional)
            <SelectRemoto url={modalidade === 'area' ? '/api/areas/' : modalidade === 'veiculo' ? '/api/veiculos/' : '/api/recursos-gerais/'}
              mostrarBusca={false}
              filtros={{ page_size: 100, ...(filtros.bloco ? { bloco: filtros.bloco } : {}), ...(filtros.tipo_recurso ? { tipo_recurso: filtros.tipo_recurso } : {}) }}
              valor={filtros.recurso} aoAlterar={(v) => alterar('recurso', v)} rotuloTodos="Todos" />
          </label>}
          <label>Responsável (opcional)<input value={filtros.responsavel} onChange={(e) => alterar('responsavel', e.target.value)} placeholder="Nome ou e-mail" /></label>
          <label>Status (opcional)<select value={filtros.status} onChange={(e) => alterar('status', e.target.value)}><option value="">Todos</option>{STATUS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></label>
          <label className={styles.checkbox}><input type="checkbox" checked={filtros.incluir_canceladas} onChange={(e) => alterar('incluir_canceladas', e.target.checked)} />Incluir canceladas e rejeitadas</label>
          <button type="submit" disabled={carregando}>{carregando ? 'Gerando...' : 'Gerar relatório'}</button>
        </form>
        {erro && <p className={styles.erro} role="alert">{erro}</p>}
        {relatorio && <section className={styles.resultado}>
          <div className={`${styles.visualizacao} ${styles.impressao}`}>
            <header><h1>Relatório de uso — {ROTULOS[modalidade]}</h1><p>Gerado por {relatorio.gerado_por} em {new Date(relatorio.gerado_em).toLocaleString('pt-BR')}</p><p>Período: {dataPt(filtros.data_inicio)} a {dataPt(filtros.data_fim)}</p></header>
            <ResumoRelatorio relatorio={relatorio} />
            <p className={styles.formula}>{relatorio.formula_ocupacao}</p>
            <div className={styles.tabela}><table><colgroup><col className={styles.colRecurso} /><col className={styles.colResponsavel} /><col className={styles.colData} /><col className={styles.colHorario} /><col className={styles.colQuantidade} /><col className={styles.colHoras} /></colgroup><thead><tr><th>Recurso</th><th>Responsável</th><th>Data</th><th>Horário</th><th>Qtd.</th><th>Horas</th></tr></thead>
              <tbody>{relatorio.resultados.map((r) => <tr key={`${r.modalidade}-${r.id}`}><td>{r.recurso}</td><td>{r.responsavel}</td><td>{dataPt(r.data)}{r.data_fim !== r.data ? ` a ${dataPt(r.data_fim)}` : ''}</td><td>{hora(r.horario_inicio)}–{hora(r.horario_fim)}</td><td>{r.quantidade}</td><td>{r.horas_ocupadas}</td></tr>)}</tbody></table></div>
            {!relatorio.resultados.length && <p>Nenhum registro encontrado.</p>}
          </div>
          <button type="button" className={styles.imprimir} onClick={() => window.print()}><Printer size={16} /> Imprimir relatório</button>
        </section>}
      </div>
    </Modal>
  </>;
}
