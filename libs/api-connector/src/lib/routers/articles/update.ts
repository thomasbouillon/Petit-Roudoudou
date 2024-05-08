import { publicProcedure } from '../../trpc';
import { isAdmin } from '../../middlewares/isAdmin';
import { articleSchema, populateDTOWithStorageFiles } from './dto';
import sluggify from 'slugify';
import { z } from 'zod';
import { moveFilesFromUploadedFolder } from './utils';
import { triggerISR } from '../../isr';
import { TRPCError } from '@trpc/server';

export default publicProcedure
  .use(isAdmin())
  .input(
    articleSchema.and(
      z.object({
        id: z.string().min(1),
      })
    )
  )
  .mutation(async ({ input, ctx }) => {
    const { id, ...beforePopulatePayload } = input;
    const articleBefore = await ctx.orm.article.findUnique({ where: { id } });
    if (!articleBefore) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Article not found',
      });
    }

    const updatePayload = await populateDTOWithStorageFiles(ctx, beforePopulatePayload, articleBefore);
    await moveFilesFromUploadedFolder(ctx, updatePayload, id);

    const article = await ctx.orm.article.update({
      where: { id },
      data: {
        ...updatePayload,
        slug: sluggify(input.namePlural, { lower: true, remove: /[*+~.()'"!:@]/g }),
        stocks: updatePayload.stocks.map((stock) => ({
          ...stock,
          slug: sluggify(stock.title, { lower: true, remove: /[*+~.()'"!:@]/g }),
        })),
      },
    });

    await triggerISR(ctx, {
      resource: 'articles',
      event: 'update',
      article: { id: article.id, slug: article.slug },
    });

    return article;
  });
