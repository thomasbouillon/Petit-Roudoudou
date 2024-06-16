import { Request, Response } from 'express';
import { TRPCClientError } from '@trpc/client';
import { z } from 'zod';
import { trpcM2M } from './trpc';
import env from './env';

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

  if (req.query.webhook_secret !== env.BOXTAL_WEBHOOK_SECRET) {
    console.error('Unauthorized boxtal request, received ' + req.query.webhook_secret);
    return res.status(401).send('Unauthorized');
  }

  const event = eventSchema.parse(req.query);

  const promise =
    event.type === 'status'
      ? // Received information from the shipping provider
        trpcM2M.orders.setShippingDetails.mutate({
          orderReference: event.reference,
          trackingNumber: event.carrier_reference,
          labelUrl: event.label_url,
        })
      : // Received shipping update
        trpcM2M.orders.addEventToShippingHistory.mutate({
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
