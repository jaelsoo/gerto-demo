// Simulação de rede/servidor para exercitar os fluxos de exceção (UC01 FE 1.1, UC09 FE 1.1/3.1 e demais).
import { storage } from './storage';

const KEY = 'network';
const DEFAULTS = { offline: false, syncFail: false };

export class NetworkError extends Error {
  constructor() {
    super('Sem conexão');
    this.name = 'NetworkError';
  }
}

export const network = {
  get() {
    return { ...DEFAULTS, ...storage.read(KEY, {}) };
  },

  set(patch) {
    const next = { ...this.get(), ...patch };
    storage.write(KEY, next);
    return next;
  },

  /** Considera offline tanto o modo "Simular Offline" quanto a perda real de conexão do navegador. */
  isOffline() {
    return this.get().offline || (typeof navigator !== 'undefined' && navigator.onLine === false);
  },

  /** Simula a latência de uma requisição HTTPS e falha quando offline. */
  request(latency = 220) {
    return new Promise((resolve, reject) => {
      setTimeout(() => (this.isOffline() ? reject(new NetworkError()) : resolve()), latency);
    });
  },
};
