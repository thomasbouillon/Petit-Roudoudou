import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';

export default publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
  const group = await ctx.orm.articleGroup.findUnique({
    where: {
      id: input,
    },
    include: {
      articles: true,
    },
  });

  if (!group) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Article group not found',
    });
  }

  return group;
});
