import { User } from '@prisma/client';
import { isAuth } from '../../middlewares/isAuth';
import { publicProcedure } from '../../trpc';

export default publicProcedure
  .use(isAuth({ allowGuest: true, allowAnonymous: true }))
  // .use(hasCart({ required: false }))
  .query(async ({ ctx }) => {
    //   if (ctx.cart && !ctx.cart.user_id) {
    //     // if an orphan cart is detected after login, we link it to the user
    //     await ctx.db.cart.update({
    //       where: { id: ctx.cart.id },
    //       data: { user_id: ctx.user.id },
    //     });
    //   } else if (ctx.cart && ctx.cart.user_id === ctx.user.id) {
    //     // TODO merge
    //   } else if (ctx.cart && ctx.cart.user_id !== ctx.user.id) {
    //     // logged in with an other account
    //     const userCart = await ctx.db.cart.findFirst({
    //       where: { user_id: ctx.user.id },
    //     });
    //     if (userCart)
    //       // else case should be impossible
    //       ctx.response.setCartCookie(userCart.id);
    //   }
    if (ctx.user === null) {
      const annoymousUser = await ctx.orm.user.create({
        data: {
          email: '',
          role: 'ANONYMOUS',
        },
      });
      ctx.cookies.setAuthCookie(ctx.auth.jwt.sign(annoymousUser.id));
      return annoymousUser as User | null;
    }
    const { password, ...userWithOutPassword } = ctx.user;
    return userWithOutPassword;
  });
