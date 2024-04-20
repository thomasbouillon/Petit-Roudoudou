import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { isAdmin } from '../../middlewares/isAdmin';
import { routes } from '@couture-next/routing';

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
      include: {
        user: true,
      },
    });

    await ctx.crm.sendEvent('orderDelivered', order.user.email, {
      REVIEW_HREF: new URL(
        routes().account().orders().order(order.id).review(),
        ctx.environment.FRONTEND_BASE_URL
      ).toString(),
    });

    if (!order) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }
  });
