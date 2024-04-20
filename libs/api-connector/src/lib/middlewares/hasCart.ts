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

    let cart = await ctx.orm.cart.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!cart)
      cart = await ctx.orm.cart.create({
        data: {
          taxes: {},
          totalTaxExcluded: 0,
          totalTaxIncluded: 0,
          totalWeight: 0,
          userId: user.id,
        },
      });

    return next({
      ctx: {
        cart,
      },
    });
  });
