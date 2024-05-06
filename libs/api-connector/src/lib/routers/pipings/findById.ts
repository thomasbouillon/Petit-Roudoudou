import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';

export default publicProcedure.input(z.string().min(1)).query(async ({ ctx, input }) => {
  const piping = await ctx.orm.piping.findUnique({
    where: {
      id: input,
    },
  });
  if (!piping) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Piping not found',
    });
  }
  return piping;
});
