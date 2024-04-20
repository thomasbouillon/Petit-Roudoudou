import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { isAuth } from '../../middlewares/isAuth';
import { mergeCart } from './utils';

export default publicProcedure
  // .use(rateLimiter(30))
  .use(isAuth({ allowGuest: true, allowAnonymous: true }))
  .input(
    z.object({
      email: z.string().email(),
      password: z.string(),
    })
  )
  .mutation(async ({ input: { email, password }, ctx }) => {
    const userBeforeLogin = ctx.user;

    const user = await ctx.orm.user.findFirst({ where: { email } });

    if (!user) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Identifiants incorrects',
      });
    }

    if (user.password === null) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Ce compte utilise une connexion Google. Connecte-toi avec Google.',
      });
    }

    const valid = await ctx.auth.verifyPassword(password, user.password);

    if (!valid) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Identifiants incorrects',
      });
    }

    if (userBeforeLogin?.role === 'ANONYMOUS') {
      await mergeCart(ctx, userBeforeLogin.id, user.id);
      await ctx.orm.user.delete({ where: { id: userBeforeLogin.id } });
    }

    const token = ctx.auth.jwt.sign(user.id);
    ctx.cookies.setAuthCookie(token);
  });
