import { TRPCError } from '@trpc/server';
import { publicProcedure } from '../../trpc';
import { z } from 'zod';
import { onOrderSubmittedHook } from './hooks/onOrderSubmittedHook';

export default publicProcedure.input(z.string()).mutation(async ({ ctx, input: originalReqRawBody }) => {
  if (!ctx.stripe.signature) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Missing stripe signature' });

  const event = await ctx.stripe.extractEventFromRawBody(originalReqRawBody, ctx.stripe.signature);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderReferenceRaw = session.client_reference_id;
    if (typeof orderReferenceRaw !== 'string')
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid client reference id' });

    const orderReference = parseInt(orderReferenceRaw);
    if (isNaN(orderReference)) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid client reference id' });

    const order = await ctx.orm.order.findUnique({
      where: { reference: orderReference },
    });
    if (!order) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Order not found' });

    if (order.status !== 'DRAFT') throw new TRPCError({ code: 'BAD_REQUEST', message: 'Order is not a draft' });

    await ctx.orm.$transaction(($transaction) =>
      Promise.all([
        // Update order
        $transaction
          .$runCommandRaw({
            update: 'Order',
            updates: [
              {
                q: { reference: orderReference },
                u: [
                  {
                    $set: {
                      status: 'PAID',
                      paidAt: {
                        $dateFromString: {
                          dateString: new Date().toISOString(),
                        },
                      },
                      'billing.paymentMethod': 'CARD',
                      workflowStep: 'PRODUCTION',
                    },
                  },
                ],
              },
            ],
          })
          .then((res) => {
            if (res['nModified'] === 0)
              throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Could not update order' });
          }),
        // Delete cart
        $transaction.cart.delete({
          where: { userId: order.userId },
        }),
        // !!! modifications in hook are  base on the state of 'order',
        // !!! careful editing the order in the same transaction
        onOrderSubmittedHook(ctx, $transaction, order),
      ])
    );
  } else {
    console.debug('Nothin to do for event', event.type);
  }
});
