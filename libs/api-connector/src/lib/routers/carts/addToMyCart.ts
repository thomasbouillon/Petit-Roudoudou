import { hasCart } from '../../middlewares/hasCart';
import { isAuth } from '../../middlewares/isAuth';
import { publicProcedure } from '../../trpc';
import { Article, CartItem, CartItemCustomized, CartItemInStock, Taxes } from '@couture-next/types';
import { Image } from '@prisma/client';
import * as dto from './dto';
import { TRPCError } from '@trpc/server';
import { getPublicUrl, getTaxes } from '@couture-next/utils';
import { Context } from '../../context';
import { v4 as uuid } from 'uuid';
import { cancelDraftOrder } from './utils';
import { getPlaiceholder } from '../../vendor/plaiceholder';

export default publicProcedure
  .use(isAuth())
  .use(hasCart())
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
        perUnitTaxExcluded: validatedCartItemInput.data.amount,
        perUnitTaxIncluded: validatedCartItemInput.data.amount,
        totalTaxExcluded: validatedCartItemInput.data.amount,
        totalTaxIncluded: validatedCartItemInput.data.amount,
        totalWeight: 0,
        taxes: {},
        quantity: 1,
      };
    } else if (input.type === 'inStock') {
      const validatedCartItemInput = await dto.addInStockPayloadSchema(ctx).safeParseAsync(input);
      if (!validatedCartItemInput.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          cause: validatedCartItemInput.error,
        });
      }

      const { articleStock, article, ...toCopy } = validatedCartItemInput.data;
      const sku = article.skus.find((sku) => sku.uid === articleStock.sku);
      if (!sku) throw 'Impossible';

      cartItem = {
        ...toCopy,
        ...calcCartItemPrice(article.customizables, toCopy.customizations, sku, 1),
        uid: uuid(),
        description: getSkuLabel(sku, article),
        image: await copyImage(ctx, ctx.cart.id, articleStock.images[0]),
        quantity: 1,
        totalWeight: sku.weight * 1,
        skuId: sku.uid,
      };
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
        ...calcCartItemPrice(article.customizables, toCopy.customizations, sku, quantity),
        uid: uuid(),
        description: getSkuLabel(sku, article),
        image: await imageFromDataUrl(ctx, ctx.cart.id, validatedCartItemInput.data.imageDataUrl),
        totalWeight: sku.weight * quantity,
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
              $push: {
                items: cartItem,
              },
              $inc: {
                totalTaxExcluded: cartItem.totalTaxExcluded,
                totalTaxIncluded: cartItem.totalTaxIncluded,
                totalWeight: cartItem.totalWeight,
                ...Object.keys(cartItem.taxes).reduce(
                  (acc, tax) => ({ ...acc, [`taxes.${tax}`]: cartItem.taxes[tax] }),
                  {}
                ),
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
        await deleteImage(ctx, cartItem.image).catch((e) =>
          console.warn('Failed to delete image, skiping, throwing original error', e)
        );
        throw e;
      });
  });

async function deleteImage(ctx: Context, image: Image) {
  // TODO also remove resized
  const bucket = ctx.storage.bucket();
  const file = bucket.file(image.uid);
  await file.delete();
}

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
  const path = `carts/${cartId}/${uuid()}`;
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

function calcCartItemPrice(
  articleCustomizables: Article['customizables'],
  customizations: (CartItemInStock | CartItemCustomized)['customizations'],
  sku: Article['skus'][number],
  quantity: number
) {
  let itemPriceTaxExcluded = sku.price;
  articleCustomizables.forEach((customizable) => {
    if (customizable.type === 'customizable-part' || !(customizable.uid in customizations)) return;
    if (customizable.price && customizations?.[customizable.uid].value) itemPriceTaxExcluded += customizable.price;
  });

  const vat = getTaxes(itemPriceTaxExcluded);
  return {
    totalTaxExcluded: itemPriceTaxExcluded * quantity,
    totalTaxIncluded: (itemPriceTaxExcluded + vat) * quantity,
    perUnitTaxExcluded: itemPriceTaxExcluded,
    perUnitTaxIncluded: itemPriceTaxExcluded + vat,
    taxes: {
      [Taxes.VAT_20]: vat * quantity,
    },
  };
}

function generateImagePlaiceholderOrNullIfError(buffer: Buffer) {
  return getPlaiceholder(buffer)
    .then((r) => r.base64)
    .catch((e) => {
      console.warn('Failed to generate placeholder', e);
      return null;
    });
}
