import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import onUserCreated from '../hooks/onUserCreated';

export default publicProcedure
  // use(rateLimiter(10))
  .input(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
      firstName: z.string().min(2),
      lastName: z.string().min(2),
    })
  )
  .mutation(async ({ input: input, ctx }) => {
    const exists = await ctx.orm.user.findFirst({
      where: { email: input.email },
    });
    if (exists)
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Un compte existe déjà avec cette adresse email',
      });

    const hashedPassword = await ctx.auth.hashPassword(input.password);

    const user = await ctx.orm.$transaction(async (transaction) => {
      const u = await transaction.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          firstName: input.firstName,
          lastName: input.lastName,
          role: 'USER',
        },
      });
      await onUserCreated(transaction, u);
      return u;
    });

    const token = ctx.auth.jwt.sign(user.id);
    ctx.cookies.setAuthCookie(token);
  });
