import { z } from 'zod';
import { isAuth } from '../../middlewares/isAuth';
import { publicProcedure } from '../../trpc';

export default publicProcedure
  .use(isAuth())
  .input(z.string())
  .query(async ({ ctx, input }) => {
    const order = await ctx.orm.order.findUnique({
      where: {
        id: input,
      },
    });

    if (!order || (ctx.user.role !== 'ADMIN' && order.userId !== ctx.user.id)) {
      throw new Error('Order not found');
    }

    return order;
  });
