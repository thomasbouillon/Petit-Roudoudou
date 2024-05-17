import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import slugify from 'slugify';
import { isAdmin } from '../../middlewares/isAdmin';
import { triggerISR } from '../../isr';
import { TRPCError } from '@trpc/server';

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

    const updated = await ctx.orm.articleGroup.update({
      where: { id },
      data: {
        ...payload,
        slug: slugify(input.name, { lower: true }),
      },
    });

    if (!updated) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Article group not found',
      });
    }

    await triggerISR(ctx, {
      resource: 'articleGroups',
      event: 'update',
      articleGroup: updated,
    }).catch((error) => {
      console.error('Failed to trigger ISR', error);
    });

    return updated;
  });
