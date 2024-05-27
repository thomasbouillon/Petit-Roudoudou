import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { createImageFromStorageUid } from './utils';
import { isAdmin } from '../../middlewares/isAdmin';

const createPipingSchema = z.object({
  name: z.string().min(1),
  image: z.string().refine((uid) => uid.startsWith('uploaded/')),
});

export default publicProcedure
  .use(isAdmin())
  .input(createPipingSchema)
  .mutation(async ({ input, ctx }) => {
    const image = await createImageFromStorageUid(ctx, input.image);
    const piping = await ctx.orm.piping.create({
      data: {
        ...input,
        image,
      },
    });

    return piping;
  });
