import styles from "./Banner.module.css";

function Banner({ saudacao, nome, subtitulo}) {
  return (
    <div className={styles.faixa}>
      <div>
        {saudacao && <p className={styles.saudacao}>{saudacao}</p>}
        <h2 className={styles.nome}>{nome}</h2>
        {subtitulo && <p className={styles.subtitulo}>{subtitulo}</p>}
      </div>
    </div>
  );
}

export default Banner;
