import { z } from 'zod';
import { publicProcedure } from '../trpc';
import { isAdmin } from '../middlewares/isAdmin';

const createTrackingLinkSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().min(1),
});

export default publicProcedure
  .use(isAdmin())
  .input(createTrackingLinkSchema)
  .mutation(async ({ input, ctx }) => {
    const { id, ...updatePayload } = input;
    await ctx.orm.trackingLink.update({
      where: { id },
      data: updatePayload,
    });
  });
