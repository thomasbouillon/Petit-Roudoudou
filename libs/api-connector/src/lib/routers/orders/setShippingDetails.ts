import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { Order } from '@prisma/client';

const eventSchema = z.object({
  orderReference: z.string(),
  labelUrl: z.string(),
  trackingNumber: z.string(),
});

type OrderShipping = Order['shipping'] & { deliveryMode: 'deliver-at-home' | 'deliver-at-pickup-point' };

export default publicProcedure
  // TODO check M2M token
  .input(eventSchema)
  .mutation(async ({ ctx, input }) => {
    const order = await ctx.orm.order.findUnique({
      where: { reference: parseInt(input.orderReference) },
      include: { user: true },
    });

    if (!order) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }

    const updatePayload = {
      $set: {
        'shipping.labelUrl': input.labelUrl satisfies NonNullable<OrderShipping['labelUrl']>,
        'shipping.trackingNumber': input.trackingNumber satisfies NonNullable<OrderShipping['trackingNumber']>,
      },
    };

    await ctx.orm.$runCommandRaw({
      update: 'Order',
      updates: [
        {
          q: { _id: { $oid: order.id } },
          u: updatePayload as any,
        },
      ],
    });

    await ctx.mailer.sendEmail(
      'order-sent',
      {
        email: order.user.email,
        firstname: order.user.firstName ?? '',
        lastname: order.user.lastName ?? '',
      },
      { ORDER_TRACKING_NUMBER: input.trackingNumber }
    );
  });
