import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';

export default publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
  const theme = await ctx.orm.articleTheme.findUnique({
    where: {
      id: input,
    },
    include: {
      articles: true,
    },
  });

  if (!theme) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Article theme not found',
    });
  }

  return theme;
});
