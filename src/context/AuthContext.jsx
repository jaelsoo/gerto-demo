import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authService, SESSION_STORAGE_KEY } from '../services/auth';
import { storage } from '../services/storage';
import { NetworkError } from '../services/network';
import { ApiError } from '../services/repository';
import { useToast } from './ToastContext';
import { firstName } from '../utils/format';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => authService.restore());
  const toast = useToast();

  // Logout/login realizado em outra aba reflete nesta (sincronização entre abas).
  useEffect(
    () =>
      storage.subscribe((key) => {
        if (key === SESSION_STORAGE_KEY) setSession(authService.restore());
      }),
    [],
  );

  const login = useCallback(
    async (email, password) => {
      try {
        const s = await authService.login(email, password);
        setSession(authService.restore() || s);
        toast.show('MSG01', { Nome: firstName(s.user.name) });
        return { ok: true };
      } catch (error) {
        if (error instanceof NetworkError) toast.show('MSG02');
        else if (error instanceof ApiError) toast.show(error.code);
        else toast.show('MSG03');
        return { ok: false, code: error.code || (error instanceof NetworkError ? 'MSG02' : 'MSG03') };
      }
    },
    [toast],
  );

  const logout = useCallback(() => {
    authService.logout();
    setSession(null);
  }, []);

  return <AuthContext.Provider value={{ session, user: session?.user || null, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
