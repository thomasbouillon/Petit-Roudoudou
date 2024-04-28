import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { Order } from '@prisma/client';
import { isAdmin } from '../../middlewares/isAdmin';

export default publicProcedure
  .use(isAdmin())
  .input(
    z.object({
      orderId: z.string(),
      trackingNumber: z.string().min(1),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const order = await ctx.orm.order.findUnique({
      where: { id: input.orderId },
      include: { user: true },
    });

    if (!order) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }

    await ctx.orm.$runCommandRaw({
      update: 'Order',
      updates: [
        {
          q: { _id: { $oid: input.orderId } },
          u: {
            $set: {
              'shipping.trackingNumber': input.trackingNumber satisfies Order['shipping']['trackingNumber'],
              workflowStep: 'SHIPPING' satisfies Order['workflowStep'],
            },
          },
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
