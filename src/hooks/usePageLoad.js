import { useCallback, useEffect, useState } from 'react';
import { network } from '../services/network';
import { useToast } from '../context/ToastContext';

/**
 * Simula a consulta à API ao abrir um módulo. Sem conexão, exibe a mensagem
 * de falha de carregamento específica do caso de uso (ex.: MSG11, MSG18, MSG25...).
 */
export function usePageLoad(errorCode, deps = []) {
  const toast = useToast();
  const [state, setState] = useState({ loading: true, error: null });

  const load = useCallback(async () => {
    setState({ loading: true, error: null });
    try {
      await network.request(160);
      setState({ loading: false, error: null });
      return true;
    } catch {
      setState({ loading: false, error: errorCode });
      toast.show(errorCode);
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorCode, toast]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload: load };
}
