import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import slugify from 'slugify';
import { isAdmin } from '../../middlewares/isAdmin';
import { triggerISR } from '../../isr';

const createSchema = z.object({
  name: z.string(),
  seo: z
    .object({
      title: z.string(),
      description: z.string(),
    })
    .optional(),
});

export default publicProcedure
  .use(isAdmin())
  .input(createSchema)
  .mutation(async ({ input, ctx }) => {
    const created = await ctx.orm.articleTheme.create({
      data: {
        ...input,
        slug: slugify(input.name, { lower: true }),
      },
    });

    await triggerISR(ctx, {
      resource: 'articleThemes',
      event: 'create',
      articleTheme: created,
    }).catch((error) => {
      console.error('Failed to trigger ISR', error);
    });

    return created;
  });
