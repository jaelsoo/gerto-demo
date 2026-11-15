// Autenticação SIMULADA (UC01). Gera um JWT de demonstração armazenado localmente.
// Não representa segurança real: não há servidor nem criptografia de credenciais.
import { storage } from './storage';
import { network } from './network';
import { ApiError, loadDb, repository } from './repository';
import { createDemoJWT, verifyDemoJWT } from '../utils/crypto';

const SESSION_KEY = 'session';
const RESET_KEY = 'password-reset';
const SESSION_HOURS = 8;

const findUser = (email) => loadDb().users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, title: u.title, phone: u.phone || '' });

export const authService = {
  async login(email, password) {
    await network.request(450); // FE 1.1 — sem conexão
    const user = findUser(email);
    if (!user || user.password !== password) throw new ApiError('MSG03'); // FE 3.1
    if (!user.active) throw new ApiError('MSG04'); // FE 3.2
    const iat = Math.floor(Date.now() / 1000);
    const token = createDemoJWT({ sub: user.id, name: user.name, email: user.email, role: user.role, iat, exp: iat + SESSION_HOURS * 3600 });
    const session = { token, user: publicUser(user) };
    storage.write(SESSION_KEY, session);
    return session;
  },

  logout() {
    storage.remove(SESSION_KEY);
  },

  /** Restaura a sessão validando o token e se a conta continua ativa (token revogado => sessão encerrada). */
  restore() {
    const session = storage.read(SESSION_KEY);
    if (!session?.token) return null;
    const payload = verifyDemoJWT(session.token);
    const user = payload && loadDb().users.find((u) => u.id === payload.sub);
    if (!payload || !user || !user.active) {
      storage.remove(SESSION_KEY);
      return null;
    }
    return { token: session.token, user: publicUser(user), payload };
  },

  /** Reautenticação do usuário logado (usada para confirmar a assinatura eletrônica — UC14). */
  verifyPassword(userId, password) {
    const user = loadDb().users.find((u) => u.id === userId);
    return Boolean(user && user.active && user.password === password);
  },

  /** CA 1 — passos 2 a 4: valida o e-mail e "envia" um código (exibido na tela por ser demonstração). */
  async requestReset(email) {
    await network.request(450);
    const user = findUser(email);
    if (!user) return { found: false };
    const code = String(Math.floor(100000 + Math.random() * 900000));
    storage.write(RESET_KEY, { email: user.email, code, exp: Date.now() + 15 * 60000 });
    return { found: true, code };
  },

  async confirmReset(email, code, newPassword) {
    await network.request(450);
    const pending = storage.read(RESET_KEY);
    if (!pending || pending.email.toLowerCase() !== email.toLowerCase() || pending.code !== code || pending.exp < Date.now()) {
      return { ok: false };
    }
    repository.updatePassword(email, newPassword);
    storage.remove(RESET_KEY);
    return { ok: true };
  },
};

export const SESSION_STORAGE_KEY = SESSION_KEY;
