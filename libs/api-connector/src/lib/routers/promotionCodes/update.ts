import { z } from 'zod';
import { isAdmin } from '../../middlewares/isAdmin';
import { publicProcedure } from '../../trpc';
import { promotionCodeSchema } from './dto';

export default publicProcedure
  .use(isAdmin())
  .input(promotionCodeSchema.and(z.object({ id: z.string() })))
  .mutation(async ({ input, ctx }) => {
    const { id, ...updatePayload } = input;
    const promotionCode = await ctx.orm.promotionCode.update({
      where: {
        id,
      },
      data: updatePayload,
    });
    return promotionCode;
  });
