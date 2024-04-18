import { z } from 'zod';
import { isAuth } from '../../middlewares/isAuth';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';

export default publicProcedure
  .use(isAuth({ role: 'ADMIN' }))
  .input(z.string())
  .mutation(async ({ ctx, input }) => {
    const beforeUpdate = await ctx.orm.order.findUnique({
      where: {
        id: input,
      },
    });

    if (!beforeUpdate) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }

    if (beforeUpdate.status !== 'WAITING_BANK_TRANSFER') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Order is not waiting for bank transfer',
      });
    }

    await ctx.orm.order.update({
      where: {
        id: input,
      },
      data: {
        status: 'PAID',
        billing: {
          update: {
            paymentMethod: 'BANK_TRANSFER',
          },
        },
        paidAt: new Date(),
        workflowStep: 'PRODUCTION',
      },
    });
  });
