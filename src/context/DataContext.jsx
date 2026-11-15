/**
 * Estado global dos dados do Gerto.
 * - Lê/escreve exclusivamente via services/repository (nunca direto no localStorage).
 * - Simula latência/rede via services/network (UC09 e fluxos de exceção).
 * - Escuta o evento "storage" para refletir alterações feitas em outras abas (UC09 — CA 3.1).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DB_STORAGE_KEY, ApiError, repository } from '../services/repository';
import { network, NetworkError } from '../services/network';
import { storage } from '../services/storage';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const toast = useToast();
  const { user } = useAuth();
  const actor = user?.name || 'Sistema';
  const [db, setDb] = useState(() => repository.load());
  const [net, setNet] = useState(() => network.get());
  const [browserOnline, setBrowserOnline] = useState(() => navigator.onLine !== false);
  const [sync, setSync] = useState({ status: 'synced', at: Date.now() });

  // Sincronização entre abas do mesmo navegador.
  useEffect(
    () =>
      storage.subscribe((key) => {
        if (key === DB_STORAGE_KEY) {
          setDb(repository.load());
          setSync({ status: 'synced', at: Date.now() });
          toast.show('MSG27');
        }
        if (key === 'network') setNet(network.get());
      }),
    [toast],
  );

  useEffect(() => {
    const on = () => setBrowserOnline(true);
    const off = () => setBrowserOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const offline = net.offline || !browserOnline;

  /**
   * Executa uma operação de escrita simulando a requisição à API.
   * opts.success: código da mensagem de sucesso; opts.offline: mensagem quando não há conexão.
   * Retorna { ok, result, error } — nunca lança.
   */
  const run = useCallback(
    async (fn, { success, successParams, offline: offlineCode = 'MSG28', errorCode } = {}) => {
      setSync((s) => ({ ...s, status: 'syncing' }));
      try {
        await network.request();
        const result = await fn();
        setDb(repository.load());
        if (success) toast.show(success, successParams);
        if (network.get().syncFail) {
          setSync({ status: 'error', at: Date.now() });
          toast.show('MSG29');
        } else {
          setSync({ status: 'synced', at: Date.now() });
        }
        return { ok: true, result };
      } catch (error) {
        if (error instanceof NetworkError) {
          setSync({ status: 'offline', at: Date.now() });
          toast.show(offlineCode);
        } else {
          setSync((s) => ({ ...s, status: 'synced' }));
          if (error instanceof ApiError) toast.show(errorCode && error.code === 'MSG12' ? 'MSG12' : error.code, error.params);
          else {
            console.error(error);
            if (errorCode) toast.show(errorCode);
          }
        }
        return { ok: false, error };
      }
    },
    [toast],
  );

  /** Recarrega os dados "do servidor" (pull-to-refresh / botão atualizar). */
  const refresh = useCallback(async () => {
    setSync((s) => ({ ...s, status: 'syncing' }));
    try {
      await network.request(500);
      setDb(repository.load());
      setSync({ status: network.get().syncFail ? 'error' : 'synced', at: Date.now() });
      return true;
    } catch {
      setSync({ status: 'offline', at: Date.now() });
      return false;
    }
  }, []);

  const setNetwork = useCallback((patch) => setNet(network.set(patch)), []);

  const actions = useMemo(() => {
    const save = (fn, data, created = 'MSG07', updated = 'MSG08', opts = {}) =>
      run(() => fn(data, actor), { success: data.id ? updated : created, ...opts });
    return {
      saveVehicle: (d) => save(repository.saveVehicle, d),
      setVehicleActive: (id, a) => run(() => repository.setVehicleActive(id, a), { success: a ? 'MSG08' : 'MSG10' }),
      saveDriver: (d) => save(repository.saveDriver, d),
      setDriverActive: (id, a) => run(() => repository.setDriverActive(id, a), { success: a ? 'MSG08' : 'MSG10' }),
      saveInterpreter: (d) => save(repository.saveInterpreter, d),
      setInterpreterActive: (id, a) => run(() => repository.setInterpreterActive(id, a), { success: a ? 'MSG08' : 'MSG10' }),
      saveClient: (d) => save(repository.saveClient, d),
      setClientActive: (id, a) => run(() => repository.setClientActive(id, a), { success: a ? 'MSG08' : 'MSG10' }),
      saveService: (d) => save(repository.saveService, d, 'MSG14', 'MSG15'),
      updateServiceStatus: (id, status) => run(() => repository.updateServiceStatus(id, status, actor), { success: 'MSG15' }),
      saveTransaction: (d) => run(() => repository.saveTransaction(d, actor), { success: 'MSG30', errorCode: 'MSG33' }),
      removeTransaction: (id) => run(() => repository.setTransactionActive(id, false), { success: 'MSG10' }),
      issueFiscalDoc: (serviceId, type) => run(() => repository.issueFiscalDoc(serviceId, type), { success: 'MSG07' }),
      saveTemplate: (d) =>
        run(() => repository.saveTemplate(d), {
          success: d.id ? 'MSG41' : 'MSG40',
          offline: d.id ? 'MSG44' : 'MSG43',
          errorCode: d.id ? 'MSG44' : 'MSG43',
        }),
      setTemplateActive: (id, a) => run(() => repository.setTemplateActive(id, a), { success: a ? 'MSG08' : 'MSG10' }),
      createContract: (serviceId, templateId) =>
        run(() => repository.createContract(serviceId, templateId, actor), { success: 'MSG07', offline: 'MSG45' }),
      updateContractStatus: (id, status, note) =>
        run(() => repository.updateContractStatus(id, status, actor, note), { success: 'MSG08', offline: 'MSG50', errorCode: 'MSG50' }),
      signContract: (id, signature) =>
        run(() => repository.signContract(id, signature, actor), { success: 'MSG46', offline: 'MSG49', errorCode: 'MSG49' }),
      addContractAttachment: (id, attachment) =>
        run(() => repository.addContractAttachment(id, attachment, actor), { success: 'MSG08', offline: 'MSG50' }),
      resetDemo: () => run(() => repository.reset(), { success: 'MSG27' }),
    };
  }, [run, actor]);

  const value = useMemo(
    () => ({ db, actions, sync, offline, net, setNetwork, refresh, actor }),
    [db, actions, sync, offline, net, setNetwork, refresh, actor],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
