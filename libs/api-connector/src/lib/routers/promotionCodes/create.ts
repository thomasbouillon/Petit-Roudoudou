import { isAdmin } from '../../middlewares/isAdmin';
import { publicProcedure } from '../../trpc';
import { promotionCodeSchema } from './dto';

export default publicProcedure
  .use(isAdmin())
  .input(promotionCodeSchema)
  .mutation(async ({ input, ctx }) => {
    const promotionCode = await ctx.orm.promotionCode.create({
      data: {
        ...input,
        used: 0,
      },
    });
    return promotionCode;
  });
