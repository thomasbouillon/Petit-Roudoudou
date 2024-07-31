import { z } from 'zod';
import { isAdmin } from '../../middlewares/isAdmin';
import { publicProcedure } from '../../trpc';
import { Prisma } from '@prisma/client';

export default publicProcedure
  .use(isAdmin())
  .input(
    z.object({
      onlyShipped: z.boolean().default(false),
      includeAchived: z.boolean().default(false),
      limit: z.number().positive().int().optional(),
    })
  )
  .query(async ({ input, ctx }) => {
    const filters: Prisma.OrderFindManyArgs['where'] = {
      status: {
        not: 'DRAFT',
      },
    };

    if (input.onlyShipped) {
      filters.workflowStep = {
        isSet: true,
        not: 'PRODUCTION',
      };
    }

    if (!input.includeAchived) {
      filters.archivedAt = null;
    }

    const orders = await ctx.orm.order.findMany({
      where: filters,
      orderBy: {
        createdAt: 'desc',
      },
      take: input.limit,
    });

    return orders;
  });
