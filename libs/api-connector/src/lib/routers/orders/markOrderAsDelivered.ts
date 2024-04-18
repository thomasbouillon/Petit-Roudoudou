import { z } from 'zod';
import { isAuth } from '../../middlewares/isAuth';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';

export default publicProcedure
  .use(isAuth({ role: 'ADMIN' }))
  .input(z.string())
  .mutation(async ({ ctx, input }) => {
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
