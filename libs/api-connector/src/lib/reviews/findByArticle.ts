import { z } from 'zod';
import { publicProcedure } from '../trpc';

export default publicProcedure.input(z.string().min(1)).query(async ({ input, ctx }) => {
  return await ctx.orm.review.findMany({
    where: {
      articleId: input,
    },
  });
});
