import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';

export default publicProcedure.input(z.string().min(1)).mutation(async ({ input, ctx }) => {
  // TODO check related article part linked to this group

  await ctx.orm
    .$transaction([
      ctx.orm.fabricGroup.delete({
        where: {
          id: input,
        },
      }),
      /* remove the given group id from all fabrics */
      ctx.orm.$runCommandRaw({
        update: 'Fabrics',
        updates: [
          {
            q: { groupIds: { $oid: input } },
            u: { $pull: { groupIds: { $oid: input } } },
          },
        ],
      }),
    ])
    .catch((error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === 'P2025' || error.code === 'P2016')) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Fabric group not found' });
      }
      throw error;
    });
});
