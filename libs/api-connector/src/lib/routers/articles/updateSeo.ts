import { z } from 'zod';
import { isAdmin } from '../../middlewares/isAdmin';
import { publicProcedure } from '../../trpc';
import { Article } from '@couture-next/types';
import { triggerISR } from '../../isr';
import { TRPCError } from '@trpc/server';

const schema = z.object({
  id: z.string().min(1),
  seo: z.object({
    title: z.string(),
    description: z.string(),
  }),
  stocks: z.array(
    z.object({
      seo: z.object({
        title: z.string(),
        description: z.string(),
      }),
      fullDescription: z.string(),
    })
  ),
});

export default publicProcedure
  .use(isAdmin())
  .input(schema)
  .mutation(async ({ ctx, input }) => {
    const { id, ...rest } = input;

    const articleBeforeUpdate = await ctx.orm.article.findUnique({
      where: {
        id,
      },
      select: { slug: true },
    });
    if (!articleBeforeUpdate) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Article not found',
      });
    }

    const updatePayload = {
      'seo.title': rest.seo.title,
      'seo.description': rest.seo.description,
      updatedAt: { $date: new Date().toISOString() },
    } as Record<string, any>;

    rest.stocks.forEach((stock, index) => {
      updatePayload[`stocks.${index}.seo.title`] = stock.seo.title satisfies Article['stocks'][number]['seo']['title'];
      updatePayload[`stocks.${index}.seo.description`] = stock.seo
        .description satisfies Article['stocks'][number]['seo']['description'];
      updatePayload[`stocks.${index}.fullDescription`] =
        stock.fullDescription satisfies Article['stocks'][number]['fullDescription'];
    });

    await ctx.orm.$runCommandRaw({
      update: 'Article',
      updates: [
        {
          q: { _id: { $oid: id } },
          u: {
            $set: updatePayload,
          },
        },
      ],
    });

    await triggerISR(ctx, {
      event: 'update',
      resource: 'articles',
      article: {
        id,
        slug: articleBeforeUpdate.slug,
      },
    });
  });
