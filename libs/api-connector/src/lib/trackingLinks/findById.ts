import { publicProcedure } from '../trpc';
import { isAdmin } from '../middlewares/isAdmin';
import { z } from 'zod';

export default publicProcedure
  .use(isAdmin())
  .input(z.string())
  .query(async ({ input, ctx }) => {
    return await ctx.orm.trackingLink.findUnique({
      where: { id: input },
    });
  });
