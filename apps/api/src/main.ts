import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { trpcRouter } from '@couture-next/api-connector';
import cors from 'cors';
import env from './env';

createHTTPServer({
  middleware: cors({
    credentials: true,
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
  }),
  router: trpcRouter,
  createContext() {
    return {};
  },
}).listen(env.PORT, env.HOST);
