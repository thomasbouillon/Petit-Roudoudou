import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import slugify from 'slugify';
import { isAdmin } from '../../middlewares/isAdmin';

const createSchema = z.object({
  name: z.string(),
});

export default publicProcedure
  .use(isAdmin())
  .input(createSchema)
  .mutation(async ({ input, ctx }) => {
    return await ctx.orm.articleGroup.create({
      data: {
        ...input,
        slug: slugify(input.name, { lower: true }),
      },
    });
  });
