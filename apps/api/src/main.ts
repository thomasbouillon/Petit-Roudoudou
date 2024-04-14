import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { trpcRouter } from '@couture-next/api-connector';
import cors from 'cors';
import env from './env';
import { PrismaClient } from '@prisma/client';
import { getStorage } from './firebase';

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

  // server
  createHTTPServer({
    middleware: cors({
      credentials: true,
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
    }),
    router: trpcRouter,
    async createContext() {
      return {
        orm: prisma,
        environment: {
          CDN_BASE_URL: env.CDN_BASE_URL,
        },
        storage,
      };
    },
  }).listen(env.PORT, env.HOST);
})();
