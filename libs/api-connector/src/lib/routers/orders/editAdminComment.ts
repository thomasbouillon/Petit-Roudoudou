import { z } from 'zod';
import { isAuth } from '../../middlewares/isAuth';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';

export default publicProcedure
  .use(isAuth({ role: 'ADMIN' }))
  .input(
    z.object({
      orderId: z.string(),
      comment: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const r = await ctx.orm.order.update({
      where: {
        id: input.orderId,
      },
      data: {
        adminComment: input.comment,
      },
    });
    if (!r) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }
  });
