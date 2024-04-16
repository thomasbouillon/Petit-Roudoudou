import { publicProcedure } from '../../trpc';
import { isAdmin } from '../../middlewares/isAdmin';
import { articleSchema, populateDTOWithStorageFiles } from './dto';
import sluggify from 'slugify';
import { moveFilesFromUploadedFolder } from './utils';

export default publicProcedure
  .use(isAdmin())
  .input(articleSchema)
  .mutation(async ({ input, ctx }) => {
    const createPayload = await populateDTOWithStorageFiles(ctx, input);

    const article = await ctx.orm.article.create({
      data: {
        ...createPayload,
        slug: sluggify(input.name, { lower: true }),
        stocks: createPayload.stocks.map((stock) => ({
          ...stock,
          slug: sluggify(stock.title),
        })),
      },
    });

    await moveFilesFromUploadedFolder(ctx, article as any, article.id);

    await ctx.orm.article.update({
      where: { id: article.id },
      data: article as any,
    });

    return article;
  });
