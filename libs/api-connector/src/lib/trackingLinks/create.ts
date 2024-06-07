import { z } from 'zod';
import { publicProcedure } from '../trpc';
import { isAdmin } from '../middlewares/isAdmin';

const createTrackingLinkSchema = z.object({
  name: z.string(),
  url: z.string().min(1),
});

export default publicProcedure
  .use(isAdmin())
  .input(createTrackingLinkSchema)
  .mutation(async ({ input, ctx }) => {
    await ctx.orm.trackingLink.create({
      data: input,
    });
  });
