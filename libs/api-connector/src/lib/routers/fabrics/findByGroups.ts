import { z } from 'zod';
import { publicProcedure } from '../../trpc';

export default publicProcedure.input(z.array(z.string().min(1))).query(async ({ input, ctx }) => {
  if (input.length === 0) return [];
  const fabrics = await ctx.orm.fabric.findMany({
    where: {
      groupIds: {
        hasSome: input,
      },
    },
  });
  return fabrics;
});
