import { z } from 'zod';
import { publicProcedure } from '../trpc';
import { Review } from '@prisma/client';

export default publicProcedure.input(z.string().min(1)).query(async ({ input, ctx }) => {
  return [] as Review[];
  // TODO when article migration is done
  // return await ctx.orm.review.findMany({
  //   where: {
  //     articleId: input,
  //   },
  // });
});
