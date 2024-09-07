import { z } from 'zod';
import { isAdmin } from '../../middlewares/isAdmin';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { computeCartWithTotal } from '../../utils';

export default publicProcedure
  .use(isAdmin())
  .input(z.string())
  .query(async ({ ctx, input }) => {
    const user = await ctx.orm.user.findUnique({
      where: {
        id: input,
      },
      include: {
        orders: true,
        cart: true,
      },
    });
    if (!user)
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    return {
      ...user,
      cart: user.cart ? await computeCartWithTotal(ctx, user.cart) : null,
    };
  });
