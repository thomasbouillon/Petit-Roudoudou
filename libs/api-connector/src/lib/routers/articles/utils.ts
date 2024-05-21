import { Article, File } from '@prisma/client';
import { Context } from '../../context';
import { getPublicUrl } from '@couture-next/utils';

export async function moveFilesFromUploadedFolder<
  TArticle extends Pick<Article, 'images'> & {
    stocks: Pick<Article['stocks'][number], 'images'>[];
    customizableVariants: Pick<Article['customizableVariants'][number], 'threeJsModel' | 'image'>[];
  }
>(ctx: Context, article: TArticle, articleId: string): Promise<TArticle> {
  const allPromises = [] as Promise<File>[];

  article.customizableVariants.forEach((variant) => {
    if (variant.threeJsModel.uid.startsWith('uploaded/')) {
      allPromises.push(
        moveFile(ctx, variant.threeJsModel.uid, articleId).then((file) => (variant.threeJsModel = file))
      );
    }
    if (variant.image.uid.startsWith('uploaded/')) {
      allPromises.push(
        moveFile(ctx, variant.image.uid, articleId).then(
          (file) =>
            (variant.image = {
              ...file,
              placeholderDataUrl: variant.image.placeholderDataUrl,
            })
        )
      );
    }
  });

  article.images.forEach((image, i) => {
    if (image.uid.startsWith('uploaded/')) {
      allPromises.push(
        moveFile(ctx, image.uid, articleId).then(
          (file) => (article.images[i] = { ...file, placeholderDataUrl: image.placeholderDataUrl })
        )
      );
    }
  });

  article.stocks.forEach((stock) => {
    stock.images.forEach((image, i) => {
      if (image.uid.startsWith('uploaded/')) {
        allPromises.push(
          moveFile(ctx, image.uid, articleId).then(
            (file) => (stock.images[i] = { ...file, placeholderDataUrl: image.placeholderDataUrl })
          )
        );
      }
    });
  });

  await Promise.all(allPromises);

  return article;
}

async function moveFile(ctx: Context, uid: string, prefixWithArticleId: string) {
  const newPath = 'articles/' + prefixWithArticleId + '/' + uid.substring('uploaded/'.length);
  console.log('moving image', uid, 'to', newPath);
  const file = ctx.storage.bucket().file(uid);
  await file.move(newPath);

  return {
    uid: newPath,
    url: getPublicUrl(newPath, ctx.environment),
  };
}
