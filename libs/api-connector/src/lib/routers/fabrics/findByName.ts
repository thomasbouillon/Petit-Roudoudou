import { z } from 'zod';
import { publicProcedure } from '../../trpc';

export default publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
  const fabrics = await ctx.orm.fabric.findMany({
    where: {
      name: {
        contains: input,
        mode: 'insensitive',
      },
    },
    take: 10,
  });
  return fabrics;
});
