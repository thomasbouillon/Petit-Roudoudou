import { Request, Response } from 'express';
import { TRPCClientError, createTRPCClient, httpLink } from '@trpc/client';
import { TRPCRouter } from '@couture-next/api-connector';
import env from './env';
import superjson from 'superjson';

export default async function (req: Request, res: Response) {
  const trpc = createTRPCClient<TRPCRouter>({
    links: [
      httpLink({
        url: `http://127.0.0.1:${env.PORT}/trpc`,
        transformer: superjson,
        headers: {
          'stripe-signature': req.headers['stripe-signature'],
        },
      }),
    ],
  });

  // proxy stripe webhook to trpc router
  await trpc.payments.validateCardPayment
    .mutate(req.body.toString())
    .then(() => res.status(200).send('OK'))
    .catch((e) => {
      console.error('[STRIPE WEBHOOK ERROR]', e);
      let code = 500;
      let message = 'Internal Server Error';
      if (e instanceof TRPCClientError && e.data) {
        code = e.data.code === 'BAD_REQUEST' ? 400 : 500;
        message = e.data.message;
      }
      res.status(code).send(message);
    });
}
