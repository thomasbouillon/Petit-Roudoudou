import { z } from 'zod';
import { publicProcedure } from '../trpc';
import { isAuth } from '../middlewares/isAuth';

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
    // TODO check orderId is valid && belongs to user && contains articleId
    // TODO update article aggregated rating

    const { orderId, ...createReviewPayload } = input;

    const review = await ctx.orm.review.create({
      data: {
        ...createReviewPayload,
        authorId: ctx.user.id,
      },
    });

    await ctx.crm.sendEvent('orderReviewed', ctx.user.email, {}).catch((e) => {
      console.error('Failed to send CRM event', e);
      console.warn('User will receive another email with a review request.');
    });

    return review;
  });
