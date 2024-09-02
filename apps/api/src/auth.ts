import { JwtPayload, sign, verify, decode } from 'jsonwebtoken';
import env from './env';
import { compare, hash } from 'bcrypt';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { z } from 'zod';

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

function getAuthorizationUrl(): string {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.append('client_id', env.GOOGLE_OAUTH_CLIENT_ID);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', 'openid email profile');
  url.searchParams.append('redirect_uri', env.GOOGLE_OAUTH_REDIRECT_URI);
  url.searchParams.append('state', 'random-state');
  return url.toString();
}

function tradeAuthorizationCode(authorizationCode: string) {
  const url = new URL('https://oauth2.googleapis.com/token');

  const rawParams = {
    client_id: env.GOOGLE_OAUTH_CLIENT_ID,
    client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    code: authorizationCode,
    grant_type: 'authorization_code',
    redirect_uri: env.GOOGLE_OAUTH_REDIRECT_URI,
  };
  const formBody = Object.keys(rawParams)
    .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(rawParams[key as keyof typeof rawParams]))
    .join('&');

  return fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody,
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      console.log(decode(data.id_token));
      return {
        user: z
          .object({
            email: z.string().email(),
            given_name: z.string(),
            family_name: z.string(),
          })
          .parse(decode(data.id_token)),
      };
    });
}

function getM2MToken(opts: CreateExpressContextOptions) {
  console.log(opts.req.headers);
  const authorizationHeader = opts.req.headers['authorization'];
  if (!authorizationHeader) {
    return null;
  }
  if (Array.isArray(authorizationHeader)) {
    return authorizationHeader[0].split(' ')[1];
  }
  return authorizationHeader.split(' ')[1];
}

function verifyM2MToken(token: string) {
  return token === env.M2M_TOKEN;
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
  googleOAuth: {
    getAuthorizationUrl,
    tradeAuthorizationCode,
  },
  m2m: {
    getToken: getM2MToken,
    verifyToken: verifyM2MToken,
  },
};
