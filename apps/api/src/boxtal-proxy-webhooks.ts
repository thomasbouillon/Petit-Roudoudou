import { Request, Response } from 'express';
import { TRPCClientError, createTRPCClient, httpLink } from '@trpc/client';
import { TRPCRouter } from '@couture-next/api-connector';
import env from './env';
import superjson from 'superjson';
import { z } from 'zod';

const eventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('status'),
    reference: z.string(),
    carrier_reference: z.string(),
    label_url: z.string(),
  }),
  z.object({
    type: z.literal('tracking'),
    reference: z.string(),
    etat: z.enum(['CMD', 'ENV', 'LIV', 'ANN']),
    date: z.string().transform((v) => new Date(v)),
    localisation: z.string().default(''),
    text: z.string(),
  }),
]);

export default async function (req: Request, res: Response) {
  console.log('Received webhook from Boxtal');
  console.debug(JSON.stringify(req.query, null, 2));

  const proxyToHost = env.HOST === '0.0.0.0' ? '127.0.0.1' : 'localhost';

  const trpc = createTRPCClient<TRPCRouter>({
    links: [
      httpLink({
        url: `http://${proxyToHost}:${env.PORT}/trpc`,
        transformer: superjson,
        headers: {
          // TODO add M2M token after checking boxtal signature
        },
      }),
    ],
  });

  const event = eventSchema.parse(req.query);

  const promise =
    event.type === 'status'
      ? // Received information from the shipping provider
        trpc.orders.setShippingDetails.mutate({
          orderReference: event.reference,
          trackingNumber: event.carrier_reference,
          labelUrl: event.label_url,
        })
      : // Received shipping update
        trpc.orders.addEventToShippingHistory.mutate({
          orderReference: event.reference,
          status: event.etat,
          date: event.date,
          message: event.text,
          location: event.localisation,
        });

  await promise
    .then(() => res.status(200).send('OK'))
    .catch((e) => {
      console.error('[BOXTAL WEBHOOK ERROR]', e);
      let code = 500;
      let message = 'Internal Server Error';
      if (e instanceof TRPCClientError && e.data) {
        code = e.data.code === 'BAD_REQUEST' ? 400 : 500;
        message = e.data.message;
      }
      res.status(code).send(message);
    });
}
