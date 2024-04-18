import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { TRPCError } from '@trpc/server';

const createGiftCardSchema = z.object({
  amount: z.number().positive(),
  image: z.object({
    url: z.string().url(),
    uid: z.string(),
    placeholderDataUrl: z
      .string()
      .optional()
      .transform((v) => v ?? null),
  }),
  email: z.string().email(),
});

export default router({
  createGiftCard: publicProcedure.input(createGiftCardSchema).mutation(async ({ input, ctx }) => {
    const userIdFromEmail = await ctx.orm.user
      .findFirst({
        where: {
          email: input.email,
        },
      })
      .then((user) => user?.id ?? null);

    const giftCard = await ctx.orm.giftCard.create({
      data: {
        amount: input.amount,
        image: input.image,
        consumedAmount: 0,
        ...(userIdFromEmail
          ? {
              status: 'CLAIMED',
              userId: userIdFromEmail,
              userEmail: null,
            }
          : {
              status: 'UNCLAIMED',
              userEmail: input.email,
              userId: null,
            }),
      },
    });

    return giftCard;
  }),

  getCartByUserId: publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
    const cart = await ctx.orm.cart.findUnique({
      where: {
        userId: input,
      },
    });
    if (!cart) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Cart not found',
      });
    }
    return cart;
  }),
});
