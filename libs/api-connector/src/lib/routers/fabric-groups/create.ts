import { z } from 'zod';
import { publicProcedure } from '../../trpc';

const createFabricGroupSchema = z.object({
  name: z.string().min(1),
});

export default publicProcedure.input(createFabricGroupSchema).mutation(async ({ input, ctx }) => {
  const fabricGroup = await ctx.orm.fabricGroup.create({
    data: input,
  });
  return fabricGroup;
});
