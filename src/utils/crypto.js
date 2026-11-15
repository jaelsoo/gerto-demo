// Utilitários criptográficos usados apenas para DEMONSTRAÇÃO (JWT simulado e hash de assinatura).
// Não oferecem segurança real: o protótipo não possui back-end.

const b64url = (obj) =>
  btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const fromB64url = (str) => JSON.parse(decodeURIComponent(escape(atob(str.replace(/-/g, '+').replace(/_/g, '/')))));

/** Hash não criptográfico (FNV-1a) — usado como "assinatura" do JWT simulado. */
export function fnv1a(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

const DEMO_SECRET = 'gerto-demo-secret';

export function createDemoJWT(payload) {
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const body = b64url(payload);
  return `${header}.${body}.${fnv1a(`${header}.${body}.${DEMO_SECRET}`)}`;
}

export function verifyDemoJWT(token) {
  try {
    const [header, body, sig] = String(token).split('.');
    if (fnv1a(`${header}.${body}.${DEMO_SECRET}`) !== sig) return null;
    const payload = fromB64url(body);
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** SHA-256 em hexadecimal (Web Crypto). Recorre a FNV-1a se indisponível (contexto não seguro). */
export async function sha256(text) {
  if (window.crypto?.subtle) {
    const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Array.from({ length: 8 }, (_, i) => fnv1a(`${i}:${text}`)).join('');
}

export const uid = (prefix) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
