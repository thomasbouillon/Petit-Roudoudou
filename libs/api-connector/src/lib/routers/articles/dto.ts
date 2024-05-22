import { z } from 'zod';
import { Context } from '../../context';
import { Article, File, Image } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { getPublicUrl } from '@couture-next/utils';
import { getPlaiceholder } from '../../vendor/plaiceholder';

export const articleSchema = z
  .object({
    name: z.string().min(1),
    namePlural: z.string().min(1),
    description: z.string().min(1),
    shortDescription: z.string().min(1),
    images: z.array(z.string()),
    seo: z.object({
      title: z.string().min(1),
      description: z.string().min(1),
    }),
    groupId: z.string().min(1).optional(),
    themeId: z.string().min(1).optional(),
    customizableVariants: z.array(
      z.object({
        uid: z.string().min(1),
        name: z.string().min(1),
        image: z.string().min(1),
        threeJsModel: z.string().min(1),
        threeJsInitialCameraDistance: z.number().min(0.1, 'La distance de la caméra doit être supérieure à 0.1'),
        threeJsAllAxesRotation: z.boolean(),
        disclaimer: z.string().optional(),
        inherits: z.array(z.string().min(1)),
        customizableParts: z.array(
          z.object({
            uid: z.string().min(1),
            label: z.string().min(1),
            fabricListId: z.string().min(1),
            threeJsModelPartId: z.string().min(1),
            size: z.tuple([z.number().min(0.01), z.number().min(0.01)]),
          })
        ),
      })
    ),
    customizables: z.array(
      z.intersection(
        z.object({
          label: z.string().min(1),
          uid: z.string().min(1),
        }),

        z.discriminatedUnion('type', [
          z.object({
            type: z.literal('customizable-text'),
            price: z.number().min(0),
            min: z.number().min(0),
            max: z.number().min(0),
          }),
          z.object({
            type: z.literal('customizable-boolean'),
            price: z.number().min(0),
          }),
          z.object({
            type: z.literal('customizable-piping'),
          }),
        ])
      )
    ),
    characteristics: z.record(
      z.object({
        label: z.string().min(1),
        values: z.record(z.string().min(1)),
      })
    ),
    skus: z.array(
      z.object({
        uid: z.string().min(1),
        price: z.number().min(0),
        weight: z.number().min(0),
        enabled: z.boolean(),
        composition: z.string().min(1),
        characteristics: z.record(z.string().min(1)),
        gtin: z.string().min(1).optional(),
        customizableVariantUid: z.string().min(1).optional(),
      })
    ),
    stocks: z.array(
      z.object({
        uid: z.string().min(1),
        title: z.string().min(1),
        description: z.string().min(1),
        shortDescription: z.string().min(1),
        images: z.array(z.string()),
        sku: z.string().min(1),
        stock: z.number().min(0),
        seo: z.object({
          title: z.string().min(1),
          description: z.string().min(1),
        }),
        inherits: z.object({
          customizables: z.record(z.boolean()),
        }),
      })
    ),
  })

  .superRefine((data, ctx) => {
    // ensure sku's customizable variants uid exists in article
    data.skus.forEach((sku, i) => {
      if (!sku.customizableVariantUid) return;
      if (!data.customizableVariants.some((v) => v.uid === sku.customizableVariantUid)) {
        ctx.addIssue({
          code: 'custom',
          path: ['skus', i, 'customizableVariantUid'],
          message: 'Invalide',
        });
      }
    });

    // ensure every inherited option in customizable variants exists
    data.customizableVariants.forEach((variant, i) => {
      variant.inherits.forEach((uid) => {
        if (!data.customizables.find((c) => c.uid === uid)) {
          ctx.addIssue({
            code: 'custom',
            path: ['customizableVariants', i, 'inherits'],
            message: 'Invalide',
          });
        }
      });
    });
    // ensure all ArticleInStock's sku is in the skus array
    const allowedSkus = data.skus.map((sku) => sku.uid);
    data.stocks.forEach((stock, i) => {
      if (!allowedSkus.includes(stock.sku)) {
        ctx.addIssue({
          code: 'invalid_enum_value',
          message: `Stock ${stock.uid} has an invalid sku`,
          path: ['stocks', i, 'sku'],
          received: stock.sku,
          options: allowedSkus,
        });
      }
    });

    // ensure all ArticleInStock's inherits are valid article customizables
    const allowedCustomizables = data.customizables.map((customizable) => customizable.uid);
    data.stocks.forEach((stock, i) => {
      const unknownKeys = Object.keys(stock.inherits.customizables).filter(
        (key) => !allowedCustomizables.includes(key)
      );
      if (unknownKeys.length) {
        ctx.addIssue({
          code: 'unrecognized_keys',
          message: `Stock ${stock.uid} has invalid inherits`,
          path: ['stocks', i, 'inherits', 'customizables'],
          keys: unknownKeys,
        });
      }
    });

    // check inherited options are unique and exist in the article
    data.customizableVariants.forEach((variant, i) => {
      const uniqueInherits = new Set(variant.inherits);
      if (uniqueInherits.size !== variant.inherits.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['customizableVariants', i, 'inherits'],
          message: 'Dupplicated characteristics',
        });
      }
      variant.inherits.forEach((uid) => {
        if (!data.customizables.find((c) => c.uid === uid)) {
          ctx.addIssue({
            code: 'custom',
            path: ['customizableVariants', i, 'inherits'],
            message: 'Unknown characteristic',
          });
        }
      });
    });
  });

export async function populateDTOWithStorageFiles(
  ctx: Context,
  input: z.infer<typeof articleSchema>,
  prevArticle?: Article
) {
  const getPrevImagePlaceholderDataUrl = (imageUid: string) => {
    return prevArticle?.images.find((image) => image.uid === imageUid)?.placeholderDataUrl ?? undefined;
  };

  const getPrevStockImagePlaceholderDataUrl = (stockUid: string, imageUid: string) => {
    return (
      prevArticle?.stocks.find((stock) => stock.uid === stockUid)?.images.find((image) => image.uid === imageUid)
        ?.placeholderDataUrl ?? undefined
    );
  };

  return {
    ...input,
    customizableVariants: await Promise.all(
      input.customizableVariants.map(async (variant) => ({
        ...variant,
        image: await getImage(ctx, variant.image),
        threeJsModel: await getFile(ctx, variant.threeJsModel),
      }))
    ),
    images: await Promise.all(input.images.map((uid) => getImage(ctx, uid, getPrevImagePlaceholderDataUrl(uid)))),
    stocks: await Promise.all(
      input.stocks.map(async (stock) => ({
        ...stock,
        images: await Promise.all(
          stock.images.map((uid) => getImage(ctx, uid, getPrevStockImagePlaceholderDataUrl(stock.uid, uid)))
        ),
      }))
    ),
  };
}

async function getFile(ctx: Context, uid: string): Promise<File> {
  const fileRef = ctx.storage.bucket().file(uid);
  if (!(await fileRef.exists())[0]) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'File not found ' + uid,
    });
  }

  return {
    uid,
    url: getPublicUrl(uid, ctx.environment),
  };
}

async function getImage(ctx: Context, uid: string, prevPlaceholder?: string): Promise<Image> {
  const file = await getFile(ctx, uid);
  let placeholderDataUrl = prevPlaceholder;
  if (!placeholderDataUrl) {
    console.debug('Generating placeholder for image', uid);
    const localFile = await ctx.storage.bucket().file(uid).download();
    placeholderDataUrl = (await getPlaiceholder(localFile[0])).base64;
  }
  return {
    ...file,
    placeholderDataUrl,
  };
}
