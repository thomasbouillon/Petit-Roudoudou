import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { createImageFromStorageUid } from './utils';
import { TRPCError } from '@trpc/server';
import { isAdmin } from '../../middlewares/isAdmin';
import { triggerISR } from '../../isr';
import { ObjectId } from 'bson';

const updateFabricSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  enabled: z.boolean(),
  image: z.string(),
  previewImage: z.string().optional(),
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

    const fabric = await ctx.orm.$transaction(async ($transaction) => {
      const updatedFabric = await $transaction.fabric.update({
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

      if (!payload.enabled) {
        const affectedCarts = await $transaction
          .$runCommandRaw({
            aggregate: 'Cart',
            cursor: {},
            pipeline: [
              {
                $unwind: '$items',
              },
              {
                $project: {
                  'items.customizations': { $objectToArray: '$items.customizations' },
                  'items.uid': '$items.uid',
                },
              },
              {
                $match: {
                  'items.customizations.v.value': prev.id,
                },
              },
              {
                $group: {
                  _id: '$_id',
                  items: { $push: '$items' },
                },
              },
            ],
          })
          .then((result) => (result as any)['cursor']['firstBatch'])
          .then((res) =>
            (res as Array<unknown>).map((item: any) => ({
              _id: item._id as ObjectId,
              itemUids: item.items.map((item: any) => item.uid as string),
            }))
          );

        await $transaction
          .$runCommandRaw({
            update: 'Cart',
            updates: [
              {
                multi: true,
                q: {
                  _id: { $in: affectedCarts.map((cart) => cart._id) },
                },
                u: {
                  $pull: {
                    items: {
                      uid: { $in: affectedCarts.flatMap((cart) => cart.itemUids) },
                    },
                  },
                },
              },
            ],
          })
          .then((result) => {
            if (result['nModified'] === 0) {
              console.warn('Failed to cart items with this fabric', result);
              // throw new Error('Failed to cart items with this fabric');
            }
          });

        await $transaction.$runCommandRaw({
          update: 'Cart',
          updates: [
            {
              multi: true,
              q: {
                _id: { $in: affectedCarts.map((cart) => cart._id) },
              },
              u: [
                {
                  $set: {
                    totalTaxExcluded: { $sum: '$items.totalTaxExcluded' },
                    totalTaxIncluded: { $sum: '$items.totalTaxIncluded' },
                    totalWeight: { $sum: '$items.totalWeight' },
                  },
                },
              ],
            },
          ],
        });
      }

      return updatedFabric;
    });

    await triggerISR(ctx, {
      resource: 'fabrics',
      event: 'update',
      fabric: { id: fabric.id },
    });

    return fabric;
  });
