import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';

export default publicProcedure.input(z.string().min(1)).query(async ({ input, ctx }) => {
  const fabric = await ctx.orm.fabric.findUnique({
    where: {
      id: input,
    },
  });
  if (!fabric) throw new TRPCError({ code: 'NOT_FOUND', message: 'Fabric not found' });
  return fabric;
});
