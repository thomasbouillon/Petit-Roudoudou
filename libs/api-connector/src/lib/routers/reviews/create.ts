import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { isAuth } from '../../middlewares/isAuth';
import { TRPCError } from '@trpc/server';

const createReviewSchema = z.object({
  text: z.string(),
  score: z.number().int().min(1).max(5),
  articleId: z.string(),
  orderId: z.string(),
  authorName: z.string(),
});

export default publicProcedure
  .use(isAuth())
  .input(createReviewSchema)
  .mutation(async ({ input, ctx }) => {
    const { orderId, ...createReviewPayload } = input;

    const order = await ctx.orm.order.findUnique({
      where: {
        id: orderId,
      },
    });
    if (!order) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Order not found',
      });
    }

    if (order.userId !== ctx.user.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You are not allowed to review this order',
      });
    }

    const linkedOrderItems = order.items
      .map((item, i) => ({ item, i }))
      .filter((orderItem) => orderItem.item.originalArticleId === createReviewPayload.articleId);
    if (linkedOrderItems.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Article not found in order',
      });
    }

    if (linkedOrderItems.every((orderItem) => orderItem.item.reviewId)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Article already reviewed',
      });
    }

    const review = await ctx.orm.$transaction(async ($transaction) => {
      // create review
      const review = await $transaction.review.create({
        data: {
          ...createReviewPayload,
          authorId: ctx.user.id,
        },
      });
      // calculate aggregated rating
      const aggregatedRating = await $transaction.review.aggregate({
        where: {
          articleId: createReviewPayload.articleId,
        },
        _avg: {
          score: true,
        },
      });
      // update article aggregated rating
      await $transaction.article.update({
        where: {
          id: createReviewPayload.articleId,
        },
        data: {
          aggregatedRating: aggregatedRating._avg.score,
          reviewIds: {
            push: review.id,
          },
        },
      }),
        // update order items with reviewId
        await $transaction
          .$runCommandRaw({
            update: 'Order',
            updates: [
              {
                q: {
                  _id: { $oid: order.id },
                },
                u: {
                  $set: linkedOrderItems.reduce((acc, orderItem) => {
                    acc[`items.${orderItem.i}.reviewId`] = review.id;
                    return acc;
                  }, {} as Record<string, string>),
                },
              },
            ],
          })
          .then((res) => {
            if (!(res as any).nModified) {
              console.warn('Failed to update order', res);
              throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to update order',
              });
            }
          });

      return review;
    });

    // notify CRM
    await ctx.crm.sendEvent('orderReviewed', ctx.user.email, {}).catch((e) => {
      console.error('Failed to send CRM event', e);
      console.warn('User will receive another email with a review request.');
    });

    return review;
  });
