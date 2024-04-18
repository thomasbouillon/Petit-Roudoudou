import { isAuth } from '../../middlewares/isAuth';
import { publicProcedure } from '../../trpc';

export default publicProcedure.use(isAuth()).query(async ({ ctx }) => {
  return await ctx.orm.order.findMany({
    where: {
      userId: ctx.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
});
