import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { createImageFromStorageUid } from './utils';
import { isAdmin } from '../../middlewares/isAdmin';

const createEmbroideryColorSchema = z.object({
  name: z.string().min(1),
  image: z.string().refine((uid) => uid.startsWith('uploaded/')),
});

export default publicProcedure
  .use(isAdmin())
  .input(createEmbroideryColorSchema)
  .mutation(async ({ input, ctx }) => {
    const image = await createImageFromStorageUid(ctx, input.image);
    const embroideryColor = await ctx.orm.embroideryColor.create({
      data: {
        ...input,
        image,
      },
    });

    return embroideryColor;
  });
