import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { isAuth } from '../../middlewares/isAuth';
import { mergeCart } from './utils';

export default publicProcedure
  .use(isAuth({ allowGuest: true, allowAnonymous: true }))
  .input(
    z.object({
      token: z.string(),
      newPassword: z.string().min(6),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const userBeforeLogin = ctx.user;

    const resetPasswordToken = await ctx.orm.resetPasswordToken.findUnique({
      where: {
        token: input.token,
      },
    });

    if (!resetPasswordToken) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Token invalide',
      });
    }

    if (resetPasswordToken.expiration < new Date()) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Token expiré',
      });
    }

    const hashedPassword = await ctx.auth.hashPassword(input.newPassword);

    await ctx.orm.$transaction(async (transaction) => {
      await transaction.user.update({
        where: {
          id: resetPasswordToken.userId,
        },
        data: {
          password: hashedPassword,
        },
      });
      await transaction.resetPasswordToken.delete({
        where: {
          id: resetPasswordToken.id,
        },
      });
    });

    if (userBeforeLogin?.role === 'ANONYMOUS') {
      await mergeCart(ctx, userBeforeLogin.id, resetPasswordToken.userId);
      await ctx.orm.user.delete({ where: { id: userBeforeLogin.id } });
    }

    const token = ctx.auth.jwt.sign(resetPasswordToken.userId);
    ctx.cookies.setAuthCookie(token);
  });
