import { Cart } from '@prisma/client';
import { isAuth } from '../../middlewares/isAuth';
import { publicProcedure } from '../../trpc';

export default publicProcedure
  .use(isAuth({ allowGuest: true, allowAnonymous: true }))
  .query(async ({ ctx }): Promise<Cart | null> => {
    if (!ctx.user) return null;

    const cart = await ctx.orm.cart.findUnique({
      where: {
        userId: ctx.user.id,
      },
    });

    if (cart) return cart;

    return await ctx.orm.cart.create({
      data: {
        taxes: {},
        totalTaxExcluded: 0,
        totalTaxIncluded: 0,
        totalWeight: 0,
        userId: ctx.user.id,
      },
    });
  });
