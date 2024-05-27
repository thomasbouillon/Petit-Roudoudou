import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { Prisma } from '@prisma/client';

export default publicProcedure
  .input(
    z.object({
      groupIds: z.array(z.string().min(1)),
      enabled: z.boolean().optional(),
    })
  )
  .query(async ({ input, ctx }) => {
    if (input.groupIds.length === 0) return [];

    const filters: Prisma.FabricFindManyArgs['where'] = {
      groupIds: {
        hasSome: input.groupIds,
      },
    };

    if (input.enabled !== undefined) {
      filters.enabled = input.enabled;
    }

    const fabrics = await ctx.orm.fabric.findMany({
      where: filters,
    });
    return fabrics;
  });
