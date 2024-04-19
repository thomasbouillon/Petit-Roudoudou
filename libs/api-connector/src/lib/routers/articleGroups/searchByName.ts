import { z } from 'zod';
import { publicProcedure } from '../../trpc';

export default publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
  return await ctx.orm.articleGroup.findMany({
    where: {
      name: {
        contains: input,
        mode: 'insensitive',
      },
    },
  });
});
