import { z } from 'zod';
import { publicProcedure } from '../../trpc';

export default publicProcedure.input(z.array(z.string())).query(async ({ input, ctx }) => {
  if (input.length === 0) {
    return [];
  }

  return await ctx.orm.giftCard.findMany({
    where: {
      id: {
        in: input,
      },
    },
  });
});
