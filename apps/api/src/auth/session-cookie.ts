import { createHash, randomBytes } from 'node:crypto';
import { sessionDurationMs } from './auth.constants';

export function createSessionToken() {
  return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function getCookieValue(cookieHeader: string | string[] | undefined, name: string) {
  const header = Array.isArray(cookieHeader) ? cookieHeader.join('; ') : cookieHeader;

  if (!header) {
    return undefined;
  }

  return header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function buildSessionCookie(name: string, token: string) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const maxAge = Math.floor(sessionDurationMs / 1000);
  const path = '/api/v1';

  return `${name}=${token}; HttpOnly; SameSite=Lax${secure}; Path=${path}; Max-Age=${maxAge}`;
}

export function buildClearSessionCookie(name: string) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const path = '/api/v1';

  return `${name}=; HttpOnly; SameSite=Lax${secure}; Path=${path}; Max-Age=0`;
}
