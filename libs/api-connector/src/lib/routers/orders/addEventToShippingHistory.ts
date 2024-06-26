import { z } from 'zod';
import { middleware, publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { Order } from '@prisma/client';

const eventSchema = z.object({
  orderReference: z.string(),
  status: z.enum(['CMD', 'ENV', 'LIV', 'ANN']),
  date: z.date(),
  message: z.string(),
  location: z.string(),
});

type OrderShipping = Order['shipping'] & { deliveryMode: 'deliver-at-home' | 'deliver-at-pickup-point' };

export default publicProcedure
  .use(
    middleware(({ ctx, next }) => {
      const m2mToken = ctx.auth.m2m.getToken();
      if (!m2mToken || !ctx.auth.m2m.verifyToken(m2mToken)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        });
      }
      return next({ ctx });
    })
  )
  .input(eventSchema)
  .mutation(async ({ ctx, input }) => {
    const order = await ctx.orm.order.findUnique({
      where: { reference: parseInt(input.orderReference) },
    });

    if (!order) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }

    const updatePayload = {
      $push: {
        'shipping.shippingHistory': {
          status: input.status,
          date: input.date.toISOString(),
          message: input.message,
          location: input.location,
        } satisfies NonNullable<OrderShipping['history']>[number],
      },
    } as Record<string, Record<string, unknown>>;

    if (input.status === 'LIV') {
      updatePayload['$set'] = {
        workflowStep: 'DELIVERED' satisfies Order['workflowStep'],
      };
    }

    await ctx.orm.$runCommandRaw({
      update: 'Order',
      updates: [
        {
          q: { _id: { $oid: order.id } },
          u: updatePayload as any,
        },
      ],
    });
  });
