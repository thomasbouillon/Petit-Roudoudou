import { User } from '@prisma/client';
import { middleware } from '../trpc';
import { Context } from '../context';
import { TRPCError } from '@trpc/server';

type ContextWithMaybeUser<T extends Context> = T & { user: User | null };

export const hasCart = () =>
  middleware(async ({ ctx, next }) => {
    const user = (ctx as ContextWithMaybeUser<typeof ctx>).user;

    if (!user)
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Missing user',
      });

    const cart = await ctx.orm.cart.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!cart)
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Could not find user cart from current user',
      });

    return next({
      ctx: {
        cart,
      },
    });
  });
