import { z } from 'zod';
import { isAuth } from '../../middlewares/isAuth';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';

const schema = z.object({
  code: z.string(),
});
export default publicProcedure
  .use(isAuth())
  .input(schema)
  .mutation(async ({ ctx, input }) => {
    const giftCard = await ctx.orm.giftCard.findFirst({
      where: {
        code: input.code,
        status: 'UNCLAIMED',
      },
    });
    if (!giftCard) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Gift card not found',
      });
    }
    await ctx.orm.giftCard.update({
      where: {
        id: giftCard.id,
      },
      data: {
        userId: ctx.user.id,
        status: 'CLAIMED',
      },
    });
  });
