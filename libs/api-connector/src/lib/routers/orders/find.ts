import { z } from 'zod';
import { isAdmin } from '../../middlewares/isAdmin';
import { publicProcedure } from '../../trpc';
import { Prisma } from '@prisma/client';

export default publicProcedure
  .use(isAdmin())
  .input(
    z.object({
      includeAlreadyShipped: z.boolean().default(false),
      includeAchived: z.boolean().default(false),
    })
  )
  .query(async ({ input, ctx }) => {
    const filters: Prisma.OrderFindManyArgs['where'] = {
      status: {
        not: 'DRAFT',
      },
    };

    if (!input.includeAlreadyShipped) {
      filters.OR = [
        {
          workflowStep: {
            isSet: true,
            not: 'DELIVERED',
          },
        },
        {
          workflowStep: {
            isSet: false,
          },
        },
      ];
    }

    if (!input.includeAchived) {
      filters.archivedAt = null;
    }

    const orders = await ctx.orm.order.findMany({
      where: filters,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders;
  });
