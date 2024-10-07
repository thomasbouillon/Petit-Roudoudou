import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { isAdmin } from '../../middlewares/isAdmin';
import { triggerISR } from '../../isr';

const schema = z.array(z.string().min(1)).transform((value) => {
  return Array.from(new Set(value));
});

export default publicProcedure
  .use(isAdmin())
  .input(schema)
  .mutation(async ({ ctx, input }) => {
    const positions = input.map((id, index) => ({
      id,
      position: index,
    }));

    const prev = await ctx.orm.article.findMany({
      where: { id: { in: input } },
      select: { id: true, position: true, slug: true },
    });

    const edited = prev.reduce((acc, article) => {
      const newPosition = positions.find((position) => position.id === article.id)?.position;
      if (newPosition !== undefined && newPosition !== article.position) {
        acc.push({
          id: article.id,
          position: newPosition,
          slug: article.slug,
        });
      }
      return acc;
    }, [] as { id: string; position: number; slug: string }[]);

    await Promise.all(
      edited.map(async ({ id, position, slug }) => {
        await ctx.orm.article.update({
          where: { id },
          data: { position },
        });
        await triggerISR(ctx, {
          resource: 'articles',
          event: 'update',
          article: { id, slug },
        });
      })
    );
  });
