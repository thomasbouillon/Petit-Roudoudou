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
        groupId: input,
      },
    });

    const [deletedGroup] = await ctx.orm
      .$transaction([
        ctx.orm.articleGroup.delete({
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
            groupId: null,
          },
        }),
      ])
      .catch((error) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === 'P2025' || error.code === 'P2016')
        ) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Article group not found' });
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
            resource: 'articleGroups',
            event: 'delete',
            articleGroup: {
              id: deletedGroup.id,
              slug: deletedGroup.slug,
            },
          })
        )
    );
  });
