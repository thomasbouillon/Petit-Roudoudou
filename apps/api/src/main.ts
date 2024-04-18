import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { Context, trpcRouter } from '@couture-next/api-connector';
import cors from 'cors';
import env from './env';
import { PrismaClient } from '@prisma/client';
import { getStorage } from './firebase';
import authHelpers from './auth';
import cookieParser from 'cookie-parser';
import express from 'express';
import { getClient } from './brevoEvents';

(async () => {
  // orm
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });
  await prisma.$connect();

  // file storage
  const storage = getStorage();

  // auth
  const auth: Context['auth'] = {
    hashPassword: authHelpers.hashPassword,
    verifyPassword: authHelpers.verifyPassword,
    jwt: authHelpers.jwt,
    googleOAuth: authHelpers.googleOAuth,
  };

  // crm client
  const crm = getClient();

  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(cookieParser());

  app.use(
    '/',
    createExpressMiddleware({
      router: trpcRouter,
      async createContext(opts) {
        return {
          orm: prisma,
          crm,
          environment: {
            CDN_BASE_URL: env.CDN_BASE_URL,
            STORAGE_BASE_URL: env.STORAGE_BASE_URL,
          },
          storage,
          auth,
          cookies: {
            setAuthCookie: (token: string) => authHelpers.cookies.setAuthCookie(opts, token),
            clearAuthCookie: () => authHelpers.cookies.clearAuthCookie(opts),
            getAuthCookie: () => authHelpers.cookies.getAuthCookie(opts),
          },
        };
      },
    })
  );

  await new Promise<void>((resolve) => {
    app.listen(env.PORT, env.HOST, resolve);
  });

  console.log(`🚀 Server ready at http://${env.HOST}:${env.PORT}`);
})();
