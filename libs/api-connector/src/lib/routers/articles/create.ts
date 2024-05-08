import { publicProcedure } from '../../trpc';
import { isAdmin } from '../../middlewares/isAdmin';
import { articleSchema, populateDTOWithStorageFiles } from './dto';
import sluggify from 'slugify';
import { moveFilesFromUploadedFolder } from './utils';
import { triggerISR } from '../../isr';

export default publicProcedure
  .use(isAdmin())
  .input(articleSchema)
  .mutation(async ({ input, ctx }) => {
    const createPayload = await populateDTOWithStorageFiles(ctx, input);

    const article = await ctx.orm.article.create({
      data: {
        ...createPayload,
        slug: sluggify(input.namePlural, { lower: true, remove: /[*+~.()'"!:@]/g }),
        stocks: createPayload.stocks.map((stock) => ({
          ...stock,
          slug: sluggify(stock.title, { lower: true, remove: /[*+~.()'"!:@]/g }),
        })),
      },
    });

    await moveFilesFromUploadedFolder(ctx, article as any, article.id);

    const { id, ...articleWithoutId } = article;

    await ctx.orm.article.update({
      where: { id: article.id },
      data: articleWithoutId as any,
    });

    await triggerISR(ctx, {
      resource: 'articles',
      event: 'create',
      article: { id: article.id, slug: article.slug },
    });

    return article;
  });
