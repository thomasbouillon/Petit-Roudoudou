import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';

export default publicProcedure
  // .use(rateLimiter(30))
  .input(
    z.object({
      email: z.string().email(),
      password: z.string(),
    })
  )
  .mutation(async ({ input: { email, password }, ctx }) => {
    const user = await ctx.orm.user.findFirst({ where: { email } });

    if (!user) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Identifiants incorrects',
      });
    }

    const valid = await ctx.auth.verifyPassword(password, user.password);

    if (!valid) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Identifiants incorrects',
      });
    }

    const token = ctx.auth.jwt.sign(user.id);
    ctx.cookies.setAuthCookie(token);
  });
