import { z } from 'zod';
import { publicProcedure } from '../../../trpc';
import onUserCreated from '../../hooks/onUserCreated';

export default publicProcedure
  .input(z.string().min(1, 'Authorization code is required'))
  .mutation(async ({ input, ctx }) => {
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

    const cookie = ctx.auth.jwt.sign(user.id);
    ctx.cookies.setAuthCookie(cookie);
  });
