import { publicProcedure } from '../trpc';
import { isAdmin } from '../middlewares/isAdmin';

export default publicProcedure.use(isAdmin()).query(async ({ ctx }) => {
  return await ctx.orm.trackingLink.findMany();
});
