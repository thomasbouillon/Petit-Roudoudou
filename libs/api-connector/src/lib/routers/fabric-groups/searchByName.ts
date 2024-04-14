import { z } from 'zod';
import { publicProcedure } from '../../trpc';

export default publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
  const fabricGroups = await ctx.orm.fabricGroup.findMany({
    where: {
      name: {
        contains: input,
        mode: 'insensitive',
      },
    },
  });
  return fabricGroups;
});
