import { isAdmin } from '../../middlewares/isAdmin';
import { publicProcedure } from '../../trpc';

export default publicProcedure.use(isAdmin()).query(async ({ ctx }) => {
  const orders = await ctx.orm.order.findMany({
    where: {
      status: {
        not: 'DRAFT',
      },
      archivedAt: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return orders;
});
