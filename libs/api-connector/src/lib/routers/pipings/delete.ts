import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { isAdmin } from '../../middlewares/isAdmin';
import { deleteImageWithResizedVariants } from '../../utils';

const updatePipingSchema = z.object({
  id: z.string().min(1),
});

export default publicProcedure
  .use(isAdmin())
  .input(updatePipingSchema)
  .mutation(async ({ input, ctx }) => {
    const prev = await ctx.orm.piping.delete({
      where: {
        id: input.id,
      },
    });

    if (!prev) throw new TRPCError({ code: 'NOT_FOUND', message: 'Piping not found' });

    await deleteImageWithResizedVariants(ctx, prev.image.uid);
  });
