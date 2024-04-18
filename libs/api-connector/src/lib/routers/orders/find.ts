import { isAuth } from '../../middlewares/isAuth';
import { publicProcedure } from '../../trpc';

export default publicProcedure.use(isAuth({ role: 'ADMIN' })).query(async ({ ctx }) => {
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
