import { useEffect, useState } from 'react';

function useDebounce(valor, atraso = 300) {
    const [valorAtrasado, setValorAtrasado] = useState(valor);

    useEffect(() => {
        const timeout = setTimeout(() => setValorAtrasado(valor), atraso);
        return () => clearTimeout(timeout);
    }, [valor, atraso]);

    return valorAtrasado;
}

export default useDebounce;
