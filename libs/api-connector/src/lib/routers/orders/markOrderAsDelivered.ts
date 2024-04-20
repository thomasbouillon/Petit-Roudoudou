import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { isAdmin } from '../../middlewares/isAdmin';

export default publicProcedure
  .use(isAdmin())
  .input(z.string())
  .mutation(async ({ ctx, input }) => {
    // const reviewUrl = new URL(
    //     routes().account().orders().order(snapshotAfter!.id).review(),
    //     env.FRONTEND_BASE_URL
    //   ).toString();
    //   // Notify CRM
    //   const crmClient = getClient(crmSecret.value());
    //   await crmClient
    //     .sendEvent('orderDelivered', nextData.user.email, {
    //       REVIEW_HREF: reviewUrl,
    //     })
    //     .catch((e) => {
    //       console.error('Error while sending event orderDelivered to CRM', e);
    //     });

    const order = await ctx.orm.order.update({
      where: {
        id: input,
      },
      data: {
        workflowStep: 'DELIVERED',
      },
    });
    if (!order) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }
  });
