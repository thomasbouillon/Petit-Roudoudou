import { z } from 'zod';
import { publicProcedure } from '../../../trpc';
import onUserCreated from '../../hooks/onUserCreated';
import { isAuth } from '../../../middlewares/isAuth';
import { mergeCart } from '../utils';

export default publicProcedure
  .use(isAuth({ allowGuest: true, allowAnonymous: true }))
  .input(z.string().min(1, 'Authorization code is required'))
  .mutation(async ({ input, ctx }) => {
    const userBeforeLogin = ctx.user;
    const { user: googleUser } = await ctx.auth.googleOAuth.tradeAuthorizationCode(input);

    let user = await ctx.orm.user.findFirst({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = await ctx.orm.$transaction(async (transaction) => {
        const u = await transaction.user.create({
          data: {
            email: googleUser.email,
            firstName: googleUser.given_name,
            lastName: googleUser.family_name,
            role: 'USER',
          },
        });
        await onUserCreated(transaction, u);
        return u;
      });
    }

    if (userBeforeLogin?.role === 'ANONYMOUS') {
      await mergeCart(ctx, userBeforeLogin.id, user.id);
      await ctx.orm.user.delete({ where: { id: userBeforeLogin.id } });
    }

    const cookie = ctx.auth.jwt.sign(user.id);
    ctx.cookies.setAuthCookie(cookie);
  });
