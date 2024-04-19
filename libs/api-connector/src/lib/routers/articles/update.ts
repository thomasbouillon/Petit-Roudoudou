import { publicProcedure } from '../../trpc';
import { isAdmin } from '../../middlewares/isAdmin';
import { articleSchema, populateDTOWithStorageFiles } from './dto';
import sluggify from 'slugify';
import { z } from 'zod';
import { moveFilesFromUploadedFolder } from './utils';
import { triggerISR } from '../../isr';

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
    const createPayload = await populateDTOWithStorageFiles(ctx, beforePopulatePayload);
    await moveFilesFromUploadedFolder(ctx, createPayload as any, id);

    const article = await ctx.orm.article.update({
      where: { id },
      data: {
        ...createPayload,
        slug: sluggify(input.name, { lower: true }),
        stocks: createPayload.stocks.map((stock) => ({
          ...stock,
          slug: sluggify(stock.title, { lower: true }),
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
