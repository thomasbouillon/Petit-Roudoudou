import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';

export default publicProcedure.input(z.string().min(1)).query(async ({ ctx, input }) => {
  const embroideryColor = await ctx.orm.embroideryColor.findUnique({
    where: {
      id: input,
    },
  });
  if (!embroideryColor) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'EmbroideryColor not found',
    });
  }
  return embroideryColor;
});
