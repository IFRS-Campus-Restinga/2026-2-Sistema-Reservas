import { Fragment } from 'react';
import SkeletonBase from './SkeletonBase';
import { Bloco } from './Bloco';
import styles from './Skeleton.module.css';

function intervalo(tamanho) {
  return Array.from({ length: tamanho }, (_, indice) => indice);
}

// Posições fixas (não aleatórias) para o skeleton não mudar a cada renderização.
function temBloco(linha, coluna) {
  return (linha * 3 + coluna * 2) % 5 === 0;
}

// Grade contínua de horários x colunas, como a do Calendário.
function GradeCalendario({ colunas, linhas, comBarra }) {
  return (
    <>
      {comBarra && (
        <>
          <div className={styles.barraGrade}>
            <Bloco largura={140} altura={36} raio={8} />
            <div className={styles.espaco} />
            <Bloco largura={150} altura={36} raio={8} />
            <Bloco largura={160} altura={36} raio={8} />
            <Bloco largura={130} altura={36} raio={8} />
          </div>
          <div className={styles.legendaGrade}>
            <Bloco largura={200} altura={10} />
            <Bloco largura={190} altura={10} />
            <Bloco largura={220} altura={10} />
          </div>
        </>
      )}

      <div className={styles.grade}>
        <div className={styles.linhaGrade}>
          <div className={styles.celulaHora} />
          {intervalo(colunas).map((coluna) => (
            <div key={coluna} className={`${styles.celulaGrade} ${styles.cabecalhoGrade}`}>
              <Bloco largura="60%" altura={14} />
              <Bloco largura="35%" altura={10} />
            </div>
          ))}
        </div>

        {intervalo(linhas).map((linha) => (
          <div key={linha} className={styles.linhaGrade} style={{ height: 56 }}>
            <div className={styles.celulaHora}>
              <Bloco largura={28} altura={8} />
            </div>
            {intervalo(colunas).map((coluna) => (
              <div key={coluna} className={styles.celulaGrade}>
                {temBloco(linha, coluna) && <Bloco altura={47} raio={6} />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

// Grade em cartões soltos, como a grade horária do EduPage.
function GradeCartoes({ colunas, linhas, comBarra }) {
  return (
    <>
      {comBarra && (
        <div className={`${styles.barraGrade} rounded-3 border-0 shadow-sm mb-4`}>
          <Bloco largura={220} altura={18} />
          <div className={styles.espaco} />
          <Bloco largura={160} altura={36} raio={8} />
          <Bloco largura={120} altura={36} raio={8} />
        </div>
      )}

      <div className={styles.gradeCartoes} style={{ '--colunas': colunas }}>
        <div />
        {intervalo(colunas).map((coluna) => (
          <Bloco key={coluna} altura={50} raio={6} />
        ))}

        {intervalo(linhas).map((linha) => (
          <Fragment key={linha}>
            <div className={styles.celulaLateral}>
              <Bloco largura={16} altura={14} />
              <Bloco largura={60} altura={8} />
            </div>
            {intervalo(colunas).map((coluna) => (
              <Bloco key={coluna} altura={80} raio={6} />
            ))}
          </Fragment>
        ))}
      </div>
    </>
  );
}

/**
 * Skeleton das telas em grade de horários (Calendário e Timetable).
 *
 * Props:
 * - rotulo: texto para leitor de tela.
 * - variante: "calendario" (grade contínua) ou "cartoes" (blocos soltos).
 * - colunas / linhas: tamanho da grade.
 * - comBarra: desenha também a barra de filtros acima da grade.
 * - className (opcional): classes do contêiner externo.
 */
function SkeletonGrade({ rotulo, variante = 'calendario', colunas = 5, linhas = 8, comBarra = false, className }) {
  const Grade = variante === 'cartoes' ? GradeCartoes : GradeCalendario;

  return (
    <SkeletonBase rotulo={rotulo} className={className}>
      <Grade colunas={colunas} linhas={linhas} comBarra={comBarra} />
    </SkeletonBase>
  );
}

export default SkeletonGrade;
