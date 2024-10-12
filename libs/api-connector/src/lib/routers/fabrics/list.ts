import { z } from 'zod';
import { publicProcedure } from '../../trpc';

const schema = z
  .object({
    includeDisabled: z.boolean().optional(),
  })
  .optional();

export default publicProcedure.input(schema).query(async ({ ctx, input }) => {
  return await ctx.orm.fabric.findMany({
    where: {
      enabled: input?.includeDisabled ? undefined : false,
    },
  });
});
