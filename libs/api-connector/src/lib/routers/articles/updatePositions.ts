import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { isAdmin } from '../../middlewares/isAdmin';

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

    await Promise.all(
      positions.map(({ id, position }) => {
        return ctx.orm.article.update({
          where: { id },
          data: { position },
        });
      })
    );
  });
