import { z } from 'zod';
import { publicProcedure } from '../trpc';
import { isAdmin } from '../middlewares/isAdmin';

export default publicProcedure
  .use(isAdmin())
  .input(z.string())
  .mutation(async ({ input, ctx }) => {
    await ctx.orm.trackingLink.delete({
      where: { id: input },
    });
  });
