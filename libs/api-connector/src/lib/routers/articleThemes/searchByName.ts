import { z } from 'zod';
import { publicProcedure } from '../../trpc';

export default publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
  return await ctx.orm.articleTheme.findMany({
    where: {
      name: {
        contains: input,
        mode: 'insensitive',
      },
    },
  });
});
