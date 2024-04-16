import { isAdmin } from '../../middlewares/isAdmin';
import { publicProcedure } from '../../trpc';

export default publicProcedure.use(isAdmin()).query(({ ctx }) => {
  return ctx.orm.promotionCode.findMany();
});
