import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { createImageFromStorageUid } from './utils';
import { TRPCError } from '@trpc/server';
import { isAdmin } from '../../middlewares/isAdmin';
import { triggerISR } from '../../isr';

const updateFabricSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  image: z.string(), // uid to S3 object
  previewImage: z.string().optional(), // uid to S3 object
  size: z.tuple([z.number(), z.number()]),
  tagIds: z.array(z.string().min(1)),
  groupIds: z.array(z.string().min(1)),
});

export default publicProcedure
  .use(isAdmin())
  .input(updateFabricSchema)
  .mutation(async ({ input, ctx }) => {
    const { id, ...payload } = input;

    const prev = await ctx.orm.fabric.findUnique({
      where: {
        id: input.id,
      },
    });

    if (!prev) throw new TRPCError({ code: 'NOT_FOUND', message: 'Fabric not found' });

    const [image, previewImage] = await Promise.all([
      prev.image.uid === payload.image ? prev.image : createImageFromStorageUid(ctx, payload.image),
      prev.previewImage?.uid === payload.previewImage
        ? prev.previewImage
        : payload.previewImage
        ? createImageFromStorageUid(ctx, payload.previewImage)
        : null,
    ]);

    const fabric = await ctx.orm.fabric.update({
      where: {
        id: input.id,
      },
      data: {
        ...payload,
        image,
        previewImage,
        groupIds: undefined,
        groups: {
          connect: input.groupIds.map((id) => ({ id })),
        },
        tagIds: undefined,
        tags: {
          connect: input.tagIds.map((id) => ({ id })),
        },
      },
    });

    await triggerISR(ctx, {
      resource: 'fabrics',
      event: 'update',
      fabric: { id: fabric.id },
    });

    return fabric;
  });
