import { z } from 'zod';
import { isAdmin } from '../../middlewares/isAdmin';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';

export default publicProcedure
  .use(isAdmin())
  .input(z.string())
  .query(async ({ input, ctx }) => {
    const code = await ctx.orm.promotionCode.findUnique({
      where: {
        id: input,
      },
    });

    if (!code) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Code not found',
      });
    }

    return code;
  });
