import { Alert } from 'react-bootstrap';

function AlertBanner({ tipo = 'sucesso', mensagem, aoFechar, acao, className = 'mb-0' }) {
  if (!mensagem) return null;

  const erro = tipo === 'erro';

  return (
    <Alert
      variant={erro ? 'danger' : 'success'}
      dismissible={Boolean(aoFechar)}
      onClose={aoFechar}
      closeLabel="Fechar aviso"
      className={`small ${className}`}
      role={erro ? 'alert' : 'status'}
    >
      {mensagem}
      {acao && (
        <>
          {' '}
          <button type="button" className="alert-link bg-transparent border-0 p-0 text-decoration-underline" onClick={acao.aoClicar}>
            {acao.rotulo}
          </button>
        </>
      )}
    </Alert>
  );
}

export default AlertBanner;
