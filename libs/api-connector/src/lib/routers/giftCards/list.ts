import { isAdmin } from '../../middlewares/isAdmin';
import { publicProcedure } from '../../trpc';

export default publicProcedure.use(isAdmin()).query(async ({ ctx }) => {
  return await ctx.orm.giftCard.findMany();
});
