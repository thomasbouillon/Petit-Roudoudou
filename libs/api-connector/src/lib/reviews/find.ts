import { z } from 'zod';
import { publicProcedure } from '../trpc';

const inputSchema = z.object({
  skip: z.number().int().min(0).optional(),
  take: z.number().int().min(1).optional(),
});

export default publicProcedure.input(inputSchema).query(async ({ input, ctx }) => {
  const [reviews, totalCount] = await Promise.all([
    await ctx.orm.review.findMany({
      skip: input.skip,
      take: input.take,
    }),
    await ctx.orm.review.count({
    }),
  ]);
  return { reviews, totalCount };
});
