import { JwtPayload, sign, verify } from 'jsonwebtoken';
import env from './env';
import { compare, hash } from 'bcrypt';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';

function signPayload(id: string): string {
  return sign({ id }, env.JWT_SECRET, {
    expiresIn: '6h',
  });
}

function decodePayload(token: string): { id: string; expiresAt?: number } {
  const decoded = verify(token, env.JWT_SECRET) as JwtPayload & { id: string };
  if (typeof decoded !== 'object' || !decoded.id || typeof decoded.id !== 'string') {
    throw new Error('Invalid token');
  }
  return {
    id: decoded.id,
    expiresAt: decoded.exp ? decoded.exp * 1000 : undefined,
  };
}

function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

function setAuthCookie(opts: CreateExpressContextOptions, token: string) {
  opts.res.cookie('auth', token.substring(0, token.length - 5), {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    domain: env.COOKIE_DOMAIN,
    maxAge: 60 * 60 * 6 * 1000,
    signed: false,
    sameSite: 'lax',
    path: '/',
  });

  opts.res.cookie('auth-client-key', token.substring(token.length - 5), {
    httpOnly: false,
    secure: env.NODE_ENV === 'production',
    domain: env.COOKIE_DOMAIN,
    maxAge: 60 * 60 * 6 * 1000,
    signed: false,
    sameSite: 'lax',
    path: '/',
  });
}

function clearAuthCookie(opts: CreateExpressContextOptions) {
  opts.res.clearCookie('auth');
}

function getAuthCookie(opts: CreateExpressContextOptions) {
  const httpOnlyCookie = opts.req.cookies['auth'];
  const clientKeyCookie = opts.req.cookies['auth-client-key'];

  if (!httpOnlyCookie || !clientKeyCookie) {
    return null;
  }
  return httpOnlyCookie + clientKeyCookie;
}

export default {
  verifyPassword,
  hashPassword,
  jwt: {
    sign: signPayload,
    decode: decodePayload,
  },
  cookies: {
    getAuthCookie,
    setAuthCookie,
    clearAuthCookie,
  },
};
