import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import slugify from 'slugify';
import { isAdmin } from '../../middlewares/isAdmin';
import { TRPCError } from '@trpc/server';
import { triggerISR } from '../../isr';

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  seo: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export default publicProcedure
  .use(isAdmin())
  .input(updateSchema)
  .mutation(async ({ input, ctx }) => {
    const { id, ...payload } = input;

    const updated = await ctx.orm.articleTheme.update({
      where: { id },
      data: {
        ...payload,
        slug: slugify(input.name, { lower: true }),
      },
    });

    if (!updated) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Article theme not found',
      });
    }

    await triggerISR(ctx, {
      resource: 'articleThemes',
      event: 'update',
      articleTheme: updated,
    }).catch((error) => {
      console.error('Failed to trigger ISR', error);
    });

    return updated;
  });
