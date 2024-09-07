import { User } from '@prisma/client';
import { middleware } from '../trpc';
import { Context } from '../context';
import { TRPCError } from '@trpc/server';
import { computeCartWithTotal } from '../utils';

type ContextWithMaybeUser<T extends Context> = T & { user: User | null };

const handlerBase = async (orm: Context['orm'], user: User | null) => {
  if (!user)
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Missing user',
    });

  let cart = await orm.cart.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!cart)
    cart = await orm.cart.create({
      data: {
        userId: user.id,
      },
    });

  return cart;
};

export const hasCartWithTotal = () =>
  middleware(async ({ ctx, next }) => {
    const user = (ctx as ContextWithMaybeUser<typeof ctx>).user;
    const cart = await handlerBase(ctx.orm, user).then((cart) => computeCartWithTotal(ctx, cart));

    return next({
      ctx: {
        cart,
      },
    });
  });

export const hasCart = () =>
  middleware(async ({ ctx, next }) => {
    const user = (ctx as ContextWithMaybeUser<typeof ctx>).user;
    const cart = await handlerBase(ctx.orm, user);

    return next({
      ctx: {
        cart,
      },
    });
  });
