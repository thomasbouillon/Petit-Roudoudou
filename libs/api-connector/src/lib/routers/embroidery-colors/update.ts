import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { createImageFromStorageUid } from './utils';
import { TRPCError } from '@trpc/server';
import { isAdmin } from '../../middlewares/isAdmin';

const updateEmbroideryColorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  image: z.string(),
});

export default publicProcedure
  .use(isAdmin())
  .input(updateEmbroideryColorSchema)
  .mutation(async ({ input, ctx }) => {
    const { id, ...payload } = input;

    const prev = await ctx.orm.embroideryColor.findUnique({
      where: {
        id: input.id,
      },
    });

    if (!prev) throw new TRPCError({ code: 'NOT_FOUND', message: 'EmbroideryColor not found' });

    const image = prev.image.uid === payload.image ? prev.image : await createImageFromStorageUid(ctx, payload.image);

    const embroideryColor = await ctx.orm.embroideryColor.update({
      where: {
        id: input.id,
      },
      data: {
        ...payload,
        image,
      },
    });

    return embroideryColor;
  });
