import { z } from 'zod';
import { Context } from '../../context';
import { Article, File, Image } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { getPublicUrl } from '@couture-next/utils';
import { getPlaiceholder } from '../../vendor/plaiceholder';

export const articleSchema = z
  .object({
    seo: z.object({
      title: z.string().min(1),
      description: z.string().min(1),
    }),
    stocks: z.array(
      z.object({
        uid: z.string().min(1),
        title: z.string().min(1),
        description: z.string().min(1),
        shortDescription: z.string().min(1),
        fullDescription: z.string().min(1),
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


    // ensure every inherited option in customizable variants exists

    // ensure all ArticleInStock's sku is in the skus array


    // ensure all ArticleInStock's inherits are valid article customizables

    // check inherited options are unique and exist in the article

export async function populateDTOWithStorageFiles(
  ctx: Context,
  input: z.infer<typeof articleSchema>,
  prevArticle?: Article
) {

  const getPrevStockImagePlaceholderDataUrl = (stockUid: string, imageUid: string) => {
    return (
      prevArticle?.stocks.find((stock) => stock.uid === stockUid)?.images.find((image) => image.uid === imageUid)
        ?.placeholderDataUrl ?? undefined
    );
  };

  return {
    ...input,
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
