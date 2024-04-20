import { z } from 'zod';
import { isAuth } from '../../middlewares/isAuth';
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
    // const mailer = getMailer();
    //   await mailer.scheduleSendEmail(
    //     'order-sent',
    //     {
    //       email: nextData.user.email,
    //       firstname: nextData.user.firstName,
    //       lastname: nextData.user.lastName,
    //     },
    //     { ORDER_TRACKING_NUMBER: nextData.shipping.trackingNumber }
    //   );

    const updateRes = await ctx.orm.$runCommandRaw({
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
    if (updateRes['nModified'] === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }
  });
