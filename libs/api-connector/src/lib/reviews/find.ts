import { z } from 'zod';
import { publicProcedure } from '../trpc';

const inputSchema = z.object({
  skip: z.number().int().min(0).default(0),
  take: z.number().int().min(1).default(100),
});

export default publicProcedure.input(inputSchema).query(async ({ input, ctx }) => {
  const resTotal = await ctx.orm.$runCommandRaw({
    aggregate: 'Review',
    cursor: {},
    pipeline: [
      {
        $group: {
          _id: {
            text: '$text',
            authorId: '$authorId',
            createdAt: '$createdAt',
          },
        },
      },
      {
        $count: 'totalCount',
      },
    ],
  });

  const reviews = await ctx.orm.review.groupBy({
    by: ['text', 'authorId', 'createdAt', 'authorName', 'score'],
    orderBy: { createdAt: 'desc' },
    skip: input.skip,
    take: input.take,
  });
  const reviewsScore = await ctx.orm.review.groupBy({
    by: ['score'],
    _count: {
      score: true,
    },
    orderBy: {
      score: 'desc',
    },
  });
  if (!('cursor' in resTotal)) throw new Error('Invalid response from MongoDB');
  if (!('firstBatch' in (resTotal['cursor'] as object))) throw new Error('Invalid response from MongoDB');
  if (!(resTotal as any).cursor.firstBatch[0]) throw new Error('Invalid response from MongoDB');
  const totalCount = (resTotal as any).cursor.firstBatch[0].totalCount;

  return {
    reviews,
    totalCount,
    reviewsScore,
  };
});
