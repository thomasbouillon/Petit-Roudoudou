import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { ArticleTheme } from '@prisma/client';
import { Article } from '@couture-next/types';

export default publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
  const theme = await ctx.orm.articleTheme.findUnique({
    where: {
      slug: input,
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

  return theme as ArticleTheme & { articles: Article[] };
});
