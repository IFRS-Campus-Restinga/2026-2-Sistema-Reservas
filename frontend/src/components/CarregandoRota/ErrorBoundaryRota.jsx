import { Component } from 'react';
import styles from './CarregandoRota.module.css';

class ErrorBoundaryRota extends Component {
  constructor(props) {
    super(props);
    this.state = { falhou: false };
  }

  static getDerivedStateFromError() {
    return { falhou: true };
  }

  componentDidUpdate(propsAnteriores) {
    if (this.state.falhou && propsAnteriores.chave !== this.props.chave) {
      this.setState({ falhou: false });
    }
  }

  render() {
    if (this.state.falhou) {
      return (
        <div className={styles.erroContainer} role="alert">
          <h2 className={styles.erroTitulo}>Não foi possível carregar esta página</h2>
          <p className={styles.erroDescricao}>
            Verifique sua conexão ou recarregue o sistema para obter a versão mais recente.
          </p>
          <button
            type="button"
            className={styles.botaoRecarregar}
            onClick={() => window.location.reload()}
          >
            Recarregar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryRota;
