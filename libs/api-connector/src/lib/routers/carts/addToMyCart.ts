import { hasCartWithTotal } from '../../middlewares/hasCart';
import { isAuth } from '../../middlewares/isAuth';
import { publicProcedure } from '../../trpc';
import { Article, CartItemCustomized, CartItemGiftCard, CartItemInStock, CartItem } from '@couture-next/types';
import { Image } from '@prisma/client';
import * as dto from './dto';
import { TRPCError } from '@trpc/server';
import { ErrorCodes, getPublicUrl } from '@couture-next/utils';
import { Context } from '../../context';
import { v4 as uuid } from 'uuid';
import { cancelDraftOrder } from './utils';
import { getPlaiceholder } from '../../vendor/plaiceholder';
import { deleteImageWithResizedVariants } from '../../utils';

export default publicProcedure
  .use(isAuth({ allowAnonymous: true }))
  .use(hasCartWithTotal())
  .input(dto.addToCartPayloadSchema)
  .mutation(async ({ ctx, input }) => {
    let cartItem: CartItem;

    await cancelDraftOrder(ctx, ctx.cart);

    if (input.type === 'giftCard') {
      // validate giftcard specific input
      const validatedCartItemInput = dto.addGiftCardPayloadSchema.safeParse(input);
      if (!validatedCartItemInput.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          cause: validatedCartItemInput.error,
        });
      }

      // create image from dataUrl
      const { imageDataUrl, ...toCopy } = validatedCartItemInput.data;
      const image = await imageFromDataUrl(ctx, ctx.cart.id, imageDataUrl);

      cartItem = {
        ...toCopy,
        uid: uuid(),
        description: 'Carte cadeau',
        image,
        quantity: 1,
      } satisfies CartItemGiftCard;
    } else if (input.type === 'inStock') {
      const validatedCartItemInput = await dto.addInStockPayloadSchema(ctx).safeParseAsync(input);
      if (!validatedCartItemInput.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          cause: validatedCartItemInput.error,
        });
      }

      const { articleStock, article, quantity, ...toCopy } = validatedCartItemInput.data;
      const sku = article.skus.find((sku) => sku.uid === articleStock.sku);
      if (!sku) throw 'Impossible';

      const quantityAlreadyInCart = ctx.cart.items.reduce((acc, item) => {
        if (item.stockUid === articleStock.uid) return acc + item.quantity;
        return acc;
      }, 0);

      if (quantityAlreadyInCart + quantity > articleStock.stock) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Not enough stock',
          cause: ErrorCodes.NOT_ENOUGH_STOCK,
        });
      }

      cartItem = {
        ...toCopy,
        uid: uuid(),
        description: getSkuLabel(sku, article),
        image: await copyImage(ctx, ctx.cart.id, articleStock.images[0]),
        quantity: quantity,
        skuId: sku.uid,
      } satisfies CartItemInStock;
    } else if (input.type === 'customized') {
      const validatedCartItemInput = await dto.addCustomizedPayloadSchema(ctx).safeParseAsync(input);
      if (!validatedCartItemInput.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          cause: validatedCartItemInput.error,
        });
      }

      const { article, sku, quantity, ...toCopy } = validatedCartItemInput.data;

      cartItem = {
        ...toCopy,
        uid: uuid(),
        description: getSkuLabel(sku, article),
        image: await imageFromDataUrl(ctx, ctx.cart.id, validatedCartItemInput.data.imageDataUrl),
        skuId: sku.uid,
        quantity,
      } satisfies CartItemCustomized;
    } else {
      throw 'not implemented';
    }

    // notify crm

    await ctx.orm
      .$runCommandRaw({
        update: 'Cart',
        updates: [
          {
            q: { _id: { $oid: ctx.cart.id } },
            u: {
              $set: {
                updatedAt: { $date: new Date().toISOString() },
              },
              $push: {
                items: cartItem,
              },
            },
          },
        ],
      })
      .then((res) => {
        if (!(res as any).nModified)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to add item to cart',
          });
      })
      .catch(async (e) => {
        // Write failed, rollback image creation
        await deleteImageWithResizedVariants(ctx, cartItem.image.uid).catch((e) =>
          console.warn('Failed to delete image, skiping, throwing original error', e)
        );
        throw e;
      });

    if (ctx.user.role !== 'ANONYMOUS') {
      await ctx.crm
        .sendEvent('cartUpdated', ctx.user.email, {})
        .catch((e) => console.warn('Failed to send event to crm', e));
    }
  });

async function copyImage(ctx: Context, cartId: string, original: Image): Promise<Image> {
  const bucket = ctx.storage.bucket();
  const file = bucket.file(original.uid);
  const originalExt = original.uid.split('.').pop();
  const path = `carts/${cartId}/${uuid()}.${originalExt}`;
  await file.copy(path);

  const [image] = await file.download();

  return {
    url: getPublicUrl(path, ctx.environment),
    uid: path,
    placeholderDataUrl: original.placeholderDataUrl ?? (await generateImagePlaiceholderOrNullIfError(image)),
  };
}

async function imageFromDataUrl(ctx: Context, cartId: string, dataUrl: string): Promise<Image> {
  // TODO ensure generate image is safe
  const bucket = ctx.storage.bucket();
  const path = `carts/${cartId}/${uuid()}.png`;
  const file = bucket.file(path);
  const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
  await file.save(buffer, { contentType: 'image/png' });
  return {
    url: getPublicUrl(path, ctx.environment),
    uid: path,
    placeholderDataUrl: await generateImagePlaiceholderOrNullIfError(buffer),
  };
}

function getSkuLabel(sku: Article['skus'][number], article: Article) {
  const skuDesc = Object.entries(sku?.characteristics)
    .map(([characId, valueId]) => article.characteristics[characId].values[valueId])
    .join(' - ');
  if (!skuDesc) return article.name;
  return `${article.name} - ${skuDesc}`;
}

function generateImagePlaiceholderOrNullIfError(buffer: Buffer) {
  return getPlaiceholder(buffer)
    .then((r) => r.base64)
    .catch((e) => {
      console.warn('Failed to generate placeholder', e);
      return null;
    });
}
