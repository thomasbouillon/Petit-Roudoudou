import { z } from 'zod';
import { isAuth } from '../../middlewares/isAuth';
import { publicProcedure } from '../../trpc';

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export default publicProcedure
  .use(isAuth())
  .input(schema)
  .mutation(async ({ ctx, input }) => {
    await ctx.orm.user.update({
      where: {
        id: ctx.user.id,
      },
      data: input,
    });
  });
