import crypto from 'node:crypto';

export const SESSION_COOKIE_NAME = 'me_session';

export function getSessionSecret(): string {
  const envSecret = process.env.SESSION_SECRET;
  if (envSecret && envSecret.length >= 16) {
    return envSecret;
  }
  // Ephemeral fallback for local dev only if SESSION_SECRET is unset
  if (!globalThis.__miEntrenamientoEphemeralSecret) {
    globalThis.__miEntrenamientoEphemeralSecret = crypto.randomBytes(32).toString('hex');
  }
  return globalThis.__miEntrenamientoEphemeralSecret;
}

declare global {
  var __miEntrenamientoEphemeralSecret: string | undefined;
}

export function validatePasswordPolicy(password: string): string | null {
  if (typeof password !== 'string' || password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }
  if (password.length > 128) {
    return 'La contraseña no puede superar los 128 caracteres.';
  }
  if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(password) || !/[0-9]/.test(password)) {
    return 'La contraseña debe incluir al menos una letra y un número.';
  }
  return null;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHex] = parts;
  if (!salt || !originalHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(originalHex, 'hex');
  if (derived.length !== original.length) return false;
  return crypto.timingSafeEqual(derived, original);
}

export function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function signSessionToken(sessionId: string): string {
  const hmac = crypto
    .createHmac('sha256', getSessionSecret())
    .update(sessionId)
    .digest('hex');
  return `${sessionId}.${hmac}`;
}

export function verifySignedSessionToken(token: string | undefined): string | null {
  if (!token || typeof token !== 'string') return null;
  const idx = token.lastIndexOf('.');
  if (idx <= 0) return null;
  const sessionId = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  if (!sessionId || !sig) return null;

  const expected = crypto
    .createHmac('sha256', getSessionSecret())
    .update(sessionId)
    .digest('hex');
  const sigBuf = Buffer.from(sig, 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  return sessionId;
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const val = part.slice(eq + 1).trim();
    if (key) {
      try {
        out[key] = decodeURIComponent(val);
      } catch {
        out[key] = val;
      }
    }
  }
  return out;
}
