import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';

export default publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
  const article = await ctx.orm.article.findFirstOrThrow({
    where: {
      slug: input,
    },
  });

  if (!article) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Article not found',
    });
  }

  return article;
});
