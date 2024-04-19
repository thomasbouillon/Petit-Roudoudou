import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { createImageFromStorageUid } from './utils';
import { isAdmin } from '../../middlewares/isAdmin';

const createFabricSchema = z.object({
  name: z.string().min(1),
  image: z.string().refine((uid) => uid.startsWith('uploaded/')), // uid to S3 object
  previewImage: z
    .string()
    .refine((uid) => uid.startsWith('uploaded/'))
    .optional(), // uid to S3 object
  size: z.tuple([z.number(), z.number()]),
  tagIds: z.array(z.string().min(1)),
  groupIds: z.array(z.string().min(1)),
});

export default publicProcedure
  .use(isAdmin())
  .input(createFabricSchema)
  .mutation(async ({ input, ctx }) => {
    const [image, previewImage] = await Promise.all([
      createImageFromStorageUid(ctx, input.image),
      input.previewImage ? createImageFromStorageUid(ctx, input.previewImage) : null,
    ]);

    const fabric = await ctx.orm.fabric.create({
      data: {
        ...input,
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

    return fabric;
  });
