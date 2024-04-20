import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { randomBytes } from 'crypto';
import { routes } from '@couture-next/routing';

export default publicProcedure.input(z.string().email()).mutation(async ({ input, ctx }) => {
  const user = await ctx.orm.user.findUnique({
    where: {
      email: input,
    },
  });

  if (!user) return await new Promise<void>((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

  const lastResetPasswordToken = await ctx.orm.resetPasswordToken.findFirst({
    where: {
      userId: user.id,
    },
    orderBy: {
      expiration: 'desc',
    },
  });

  // ignore if last request has been made less than 1 minute ago
  if (
    lastResetPasswordToken &&
    lastResetPasswordToken.createdAt &&
    lastResetPasswordToken.createdAt > new Date(Date.now() - 1000 * 60)
  ) {
    return;
  }

  const resetPasswordToken = await ctx.orm.resetPasswordToken.create({
    data: {
      token: randomBytes(32).toString('hex'),
      expiration: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
      userId: user.id,
    },
  });

  await ctx.mailer.sendEmail('auth-reset-password', input, {
    RESET_PASSWORD_HREF: new URL(
      routes().auth().changePasswordWithToken(resetPasswordToken.token),
      ctx.environment.FRONTEND_BASE_URL
    ).toString(),
  });
});
