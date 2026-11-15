// Adaptador de persistência local. É o ÚNICO módulo que acessa o localStorage.
// Para migrar para uma API REST, basta substituir este adaptador e o repository.js.

const PREFIX = 'gerto:';

export const storage = {
  key: (name) => PREFIX + name,

  read(name, fallback = null) {
    try {
      const raw = window.localStorage.getItem(PREFIX + name);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  write(name, value) {
    window.localStorage.setItem(PREFIX + name, JSON.stringify(value));
  },

  remove(name) {
    try {
      window.localStorage.removeItem(PREFIX + name);
    } catch {
      /* ignora */
    }
  },

  /**
   * Observa alterações feitas em OUTRAS abas do mesmo navegador (evento "storage").
   * Usado para simular a sincronização em tempo real entre dispositivos (UC09).
   */
  subscribe(callback) {
    const handler = (event) => {
      if (event.key && event.key.startsWith(PREFIX)) callback(event.key.slice(PREFIX.length));
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  },
};
