import { Article, File } from '@prisma/client';
import { Context } from '../../context';

export async function moveFilesFromUploadedFolder<TArticle extends Pick<Article, 'threeJsModel' | 'images' | 'stocks'>>(
  ctx: Context,
  article: TArticle,
  articleId: string
): Promise<TArticle> {
  const allPromises = [] as Promise<File>[];

  if (article.threeJsModel.uid.startsWith('uploaded/')) {
    allPromises.push(moveFile(ctx, article.threeJsModel.uid, articleId).then((file) => (article.threeJsModel = file)));
  }

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
  const newPath = 'articles/' + uid.substring('uploaded/'.length);
  console.log('moving image', uid, 'to', newPath);
  const file = ctx.storage.bucket().file(uid);
  await file.move(newPath);

  return {
    uid: newPath,
    url: new URL(encodeURIComponent(newPath), ctx.environment.CDN_BASE_URL).toString() + '?alt=media',
  };
}
