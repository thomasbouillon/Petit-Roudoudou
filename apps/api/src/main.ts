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
import { createStripeClient } from '@couture-next/billing';
import { BoxtalClient } from '@couture-next/shipping';
import { getCmsClient } from '@couture-next/cms';
import stripeProxyWebhooks from './stripe-proxy-webhooks';
import bodyParser from 'body-parser';
import { getMailer } from './mailer';
import { getHTTPStatusCodeFromError } from '@trpc/server/unstable-core-do-not-import';
import { validateRecaptcha } from './recaptcha';
import { startCronTasks } from './cronTasks';
import boxtalProxyWebhooks from './boxtal-proxy-webhooks';

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
    m2m: {
      verifyToken: authHelpers.m2m.verifyToken,
      getToken: null as any, // set after
    },
  };

  // crm client
  const crm = getClient();

  // Stripe
  const { extractEventFromRawBody, ...stripeClient } = createStripeClient(
    env.STRIPE_SECRET_KEY,
    env.STRIPE_WEBHOOK_SECRET
  );

  // CMS
  const cmsClient = getCmsClient(env.CMS_BASE_URL);

  // Mailer
  const mailerClient = getMailer(env.MAILER_CLIENT_KEY);

  // Boxtal
  const boxtalClient = new BoxtalClient(env.BOXTAL_API_URL, env.BOXTAL_USER, env.BOXTAL_SECRET, {
    ENABLE_VAT_PASS_THROUGH: env.ENABLE_VAT_PASS_THROUGH,
    ROUDOUDOU_API_BASE_URL: env.BASE_URL,
    SENDER_FIRSTNAME: env.BOXTAL_SENDER_FIRSTNAME,
    SENDER_LASTNAME: env.BOXTAL_SENDER_LASTNAME,
    SENDER_ADDRESS: env.BOXTAL_SENDER_ADDRESS,
    SENDER_EMAIL: env.BOXTAL_SENDER_EMAIL,
    SENDER_PHONE: env.BOXTAL_SENDER_PHONE,
    SENDER_CITY: env.BOXTAL_SENDER_CITY,
    SENDER_ZIPCODE: env.BOXTAL_SENDER_ZIPCODE,
    SENDER_COUNTRY: env.BOXTAL_SENDER_COUNTRY,
    WEBHOOK_SECRET: env.BOXTAL_WEBHOOK_SECRET,
  });

  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(cookieParser());
  app.use(
    '/trpc',
    createExpressMiddleware({
      router: trpcRouter,
      async createContext(opts) {
        return {
          orm: prisma,
          crm,
          stripe: {
            extractEventFromRawBody,
            signature: opts.req.headers['stripe-signature'] as string | undefined,
          },
          environment: {
            CDN_BASE_URL: env.CDN_BASE_URL,
            STORAGE_BASE_URL: env.STORAGE_BASE_URL,
            FRONTEND_BASE_URL: env.FRONTEND_BASE_URL,
            ISR_SECRET: env.ISR_SECRET,
            ISR_URL: env.ISR_URL,
            ADMIN_EMAIL: env.ADMIN_EMAIL,
          },
          storage,
          auth: {
            ...auth,
            m2m: {
              ...auth.m2m,
              getToken: () => authHelpers.m2m.getToken(opts),
            },
          },
          billing: stripeClient,
          cms: cmsClient,
          cookies: {
            setAuthCookie: (token: string) => authHelpers.cookies.setAuthCookie(opts, token),
            clearAuthCookie: () => authHelpers.cookies.clearAuthCookie(opts),
            getAuthCookie: () => authHelpers.cookies.getAuthCookie(opts),
          },
          mailer: mailerClient,
          shipping: boxtalClient,
          validateRecaptcha,
        };
      },
      onError(err) {
        try {
          const status = getHTTPStatusCodeFromError(err.error);
          if (status >= 500) {
            console.error(err.error);
          }
        } catch (e) {
          console.error(e);
        }
      },
    })
  );

  app.post(
    '/stripe-webhook',
    bodyParser.raw({
      type: '*/*',
      inflate: true,
      limit: '1mb',
    }),
    stripeProxyWebhooks
  );

  app.get('/boxtal-webhook', boxtalProxyWebhooks);

  await new Promise<void>((resolve) => {
    app.listen(env.PORT, env.HOST, resolve);
  });

  // Starting cron jobs
  startCronTasks();

  console.log(`🚀 Server ready at http://${env.HOST}:${env.PORT}`);
})();
