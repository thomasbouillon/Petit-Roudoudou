import { CartWithTotal } from '@couture-next/types';
import { isAuth } from '../../middlewares/isAuth';
import { publicProcedure } from '../../trpc';
import { computeCartWithTotal } from '../../utils';

export default publicProcedure
  .use(isAuth({ allowGuest: true, allowAnonymous: true }))
  .query(async ({ ctx }): Promise<CartWithTotal | null> => {
    if (!ctx.user) return null;

    let cart = await ctx.orm.cart.findUnique({
      where: {
        userId: ctx.user.id,
      },
    });

    if (!cart) {
      cart = await ctx.orm.cart.create({
        data: {
          userId: ctx.user.id,
        },
      });
    }

    return computeCartWithTotal(ctx, cart);
  });
