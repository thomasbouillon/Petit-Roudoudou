import { z } from 'zod';
import { isAuth } from '../../middlewares/isAuth';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { hasCart } from '../../middlewares/hasCart';

export default publicProcedure
  .use(isAuth())
  .use(hasCart())
  .input(z.string().min(1))
  .query(async ({ ctx, input }) => {
    const promotionCode = await ctx.orm.promotionCode.findFirst({
      where: {
        code: input,
      },
    });

    if (!promotionCode) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Promotion code not found or not applicable',
      });
    }

    return 10; //
  });
