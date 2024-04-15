import { isAuth } from '../../middlewares/isAuth';
import { publicProcedure } from '../../trpc';

export default publicProcedure.use(isAuth()).query(async ({ ctx }) => {
  return ctx.orm.giftCard.findMany({
    where: {
      userId: ctx.user.id,
    },
  });
});
