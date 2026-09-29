
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './CalendarioReserva.module.css';

function dataISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

function CalendarioReserva({
  mes,
  alterarMes,
  selecionada,
  selecionar,
  dataMinima,
  inicioPeriodo,
  fimPeriodo,
}) {
  const hoje = dataISO(new Date());
  const primeiraData = dataMinima && dataMinima > hoje ? dataMinima : hoje;
  const primeiroDia = new Date(mes.getFullYear(), mes.getMonth(), 1);
  const diasDoMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const deslocamento = primeiroDia.getDay();

  const dias = Array.from({ length: deslocamento + diasDoMes }, (_, indice) => {
    const dia = indice - deslocamento + 1;
    return dia > 0 ? dia : null;
  });

  const mesAtual = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const podeVoltar = mes > mesAtual;

  function mudarMes(diferenca) {
    alterarMes(new Date(mes.getFullYear(), mes.getMonth() + diferenca, 1));
  }

  return (
    <div className={styles.calendario}>
      <div className={styles.navegacao}>
        <button
          type="button"
          aria-label="Mês anterior"
          disabled={!podeVoltar}
          onClick={() => mudarMes(-1)}
        >
          <ChevronLeft size={17} />
        </button>

        <strong>
          {mes.toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric',
          })}
        </strong>

        <button
          type="button"
          aria-label="Próximo mês"
          onClick={() => mudarMes(1)}
        >
          <ChevronRight size={17} />
        </button>
      </div>

      <div className={styles.grade}>
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dia, indice) => (
          <span className={styles.semana} key={indice}>
            {dia}
          </span>
        ))}

        {dias.map((dia, indice) => {
          if (!dia) {
            return <span key={`vazio-${indice}`} />;
          }

          const valor = dataISO(
            new Date(mes.getFullYear(), mes.getMonth(), dia)
          );
          const dentroDoPeriodo = Boolean(
            inicioPeriodo && fimPeriodo &&
            valor > inicioPeriodo && valor < fimPeriodo
          );
          const limiteDoPeriodo = valor === inicioPeriodo || valor === fimPeriodo;
          const classes = [
            valor === selecionada ? styles.selecionado : '',
            dentroDoPeriodo ? styles.noPeriodo : '',
            limiteDoPeriodo ? styles.limitePeriodo : '',
          ].filter(Boolean).join(' ');

          return (
            <button
              type="button"
              key={valor}
              disabled={valor < primeiraData}
              className={classes}
              aria-pressed={valor === selecionada}
              onClick={() => selecionar(valor)}
            >
              {dia}
            </button>
          );
        })}
      </div>

      <p className={styles.nota}>
        A disponibilidade será confirmada ao enviar a reserva
      </p>
    </div>
  );
}

export default CalendarioReserva;
