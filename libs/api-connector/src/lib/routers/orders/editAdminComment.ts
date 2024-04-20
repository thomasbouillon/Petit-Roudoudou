import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { isAdmin } from '../../middlewares/isAdmin';

export default publicProcedure
  .use(isAdmin())
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
