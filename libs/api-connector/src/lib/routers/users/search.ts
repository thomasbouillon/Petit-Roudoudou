import { z } from 'zod';
import { isAdmin } from '../../middlewares/isAdmin';
import { publicProcedure } from '../../trpc';
import { Prisma } from '@prisma/client';

export default publicProcedure
  .use(isAdmin())
  .input(z.string().optional())
  .query(async ({ ctx, input }) => {
    const filters: Prisma.UserFindManyArgs['where'] = {
      AND: [{ OR: [{ role: 'ADMIN' }, { role: 'USER' }] }],
    };

    if (input) {
      if (!Array.isArray(filters.AND)) throw 'Invalid filters.AND type';
      filters.AND.push({
        OR: [
          {
            email: {
              contains: input,
              mode: 'insensitive',
            },
          },
          {
            firstName: {
              contains: input,
              mode: 'insensitive',
            },
          },
          {
            lastName: {
              contains: input,
              mode: 'insensitive',
            },
          },
        ],
      });
    }

    const [count, users] = await Promise.all([
      ctx.orm.user.count({ where: filters }),
      ctx.orm.user.findMany({
        where: filters,
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),
    ]);

    return {
      count,
      users,
    };
  });
