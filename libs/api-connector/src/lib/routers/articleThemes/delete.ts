import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { isAdmin } from '../../middlewares/isAdmin';
import { triggerISR } from '../../isr';

export default publicProcedure
  .use(isAdmin())
  .input(z.string().min(1))
  .mutation(async ({ input, ctx }) => {
    const relatedArticles = await ctx.orm.article.findMany({
      where: {
        themeId: input,
      },
    });

    const [deletedTheme] = await ctx.orm
      .$transaction([
        ctx.orm.articleTheme.delete({
          where: {
            id: input,
          },
        }),
        ctx.orm.article.updateMany({
          where: {
            id: {
              in: relatedArticles.map((article) => article.id),
            },
          },
          data: {
            themeId: null,
          },
        }),
      ])
      .catch((error) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === 'P2025' || error.code === 'P2016')
        ) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Article theme not found' });
        }
        throw error;
      });

    await Promise.all(
      relatedArticles
        .map(async (article) => {
          await triggerISR(ctx, {
            resource: 'articles',
            event: 'update',
            article: { id: article.id, slug: article.slug },
          });
        })
        .concat(
          triggerISR(ctx, {
            resource: 'articleThemes',
            event: 'delete',
            articleTheme: {
              id: deletedTheme.id,
              slug: deletedTheme.slug,
            },
          })
        )
    );
  });
