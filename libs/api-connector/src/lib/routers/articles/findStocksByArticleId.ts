import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';

export default publicProcedure
  .input(
    z.object({
      articleId: z.string(),
      limit: z.number(),
      blacklistedStockUids: z.array(z.string()).optional(),
      cursor: z.any(),
    })
  )
  .query(async ({ ctx, input }) => {
    const article = await ctx.orm.article.findUnique({
      where: {
        id: input.articleId,
      },
    });
    if (!article) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Article not found',
      });
    }

    const stocksWithoutBlacklisted = article.stocks.filter((stock) => !input.blacklistedStockUids?.includes(stock.uid));
    return {
      stocks: stocksWithoutBlacklisted.slice(input.cursor, input.cursor + input.limit),
      nextCursor: Math.min(input.cursor + input.limit, stocksWithoutBlacklisted.length),
    };
  });
