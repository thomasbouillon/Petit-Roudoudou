import { Article } from '@couture-next/types';
import { getStorage } from 'firebase-admin/storage';
import { AggregateField, getFirestore } from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getPublicUrl } from './utils';
import { getPlaiceholder } from './vendor/plaiceholder';

// Careful, do not update or delete article, this would create an infinite loop
export const onArticleWritten = onDocumentWritten('articles/{docId}', async (event) => {
  const snapshotBefore = event.data?.before;
  const prevData = snapshotBefore?.data() as Omit<Article, '_id'> | undefined;
  const snapshotAfter = event.data?.after;
  const nextData = snapshotAfter?.data() as Omit<Article, '_id'> | undefined;

  const storage = getStorage();

  // Update rating
  if (
    snapshotAfter &&
    nextData &&
    (prevData?.reviewIds.some((id) => !nextData?.reviewIds.includes(id)) ||
      nextData?.reviewIds.some((id) => !prevData?.reviewIds.includes(id)))
  ) {
    const aggregateSnapshot = await getFirestore()
      .collection('reviews')
      .where('articleId', '==', snapshotAfter.id)
      .aggregate({
        avgScore: AggregateField.average('score'),
      })
      .get();
    const avgScore = aggregateSnapshot.data().avgScore;

    await snapshotAfter.ref.set({ aggregatedRating: avgScore }, { merge: true });
  }

  // move new uploaded images to articles folder
  // this will retrigger the function, but only once
  const allStoragePromises = [];

  nextData?.images.forEach(async (image, i) => {
    if (!image.uid.startsWith('uploaded/')) return;
    allStoragePromises.push(handleArticleImage(image.uid).then((edited) => (nextData.images[i] = edited)));
  }) ?? [];

  nextData?.stocks.forEach((stock, i) => {
    stock.images.forEach(async (image, j) => {
      if (!image.uid.startsWith('uploaded/')) return;
      allStoragePromises.push(handleArticleImage(image.uid).then((edited) => (nextData.stocks[i].images[j] = edited)));
    });
  });

  // 3D model
  if (nextData?.treeJsModel.uid.startsWith('uploaded/')) {
    console.log('3D model', nextData.treeJsModel.uid);
    allStoragePromises.push(
      (async () => {
        const newPath = 'articles/' + nextData.treeJsModel.uid.substring('uploaded/'.length);
        console.log('moving image', nextData.treeJsModel.uid, 'to', newPath);
        const file = storage.bucket().file(nextData?.treeJsModel.uid);
        await file.move(newPath);
        nextData.treeJsModel.uid = newPath;
        nextData.treeJsModel.url = getPublicUrl(newPath);
        return null;
      })()
    );
  }

  await Promise.all(allStoragePromises).then(async (results) => {
    // update article with new image paths
    if (results.length > 0 && nextData) {
      await event.data?.after?.ref.set(nextData);
    }
  });

  // remove deleted images
  const removedImages =
    prevData?.images.filter((image) => !nextData?.images.find((img) => img.uid === image.uid)) ?? [];
  // deleted stocks or deleted stock image
  prevData?.stocks.forEach((prevStock) => {
    // deleted stock
    const nextStock = nextData?.stocks.find((s) => s.uid === prevStock.uid);
    if (!nextStock) removedImages.push(...prevStock.images);
    // deleted stock image
    else
      prevStock.images.forEach((prevStockImage) => {
        const removed =
          nextStock.images.find((nextStockImage) => nextStockImage.uid === prevStockImage.uid) === undefined;
        if (removed) removedImages.push(prevStockImage);
      });
  });
  await Promise.all(
    removedImages.map(async (image) => {
      console.log('Removed image', image.uid);
      const file = storage.bucket().file(image.uid);
      if (await file.exists().then((res) => res[0])) await file.delete();
    })
  );

  // remove deleted 3D model
  if (prevData?.treeJsModel.uid && prevData.treeJsModel.uid !== nextData?.treeJsModel.uid) {
    console.log('Removed 3D model', prevData.treeJsModel.uid);
    const file = storage.bucket().file(prevData.treeJsModel.uid);
    if (await file.exists().then((res) => res[0])) await file.delete();
  }
});

async function handleArticleImage(imagePath: string) {
  console.log('Changed image');
  const storage = getStorage();
  const newPath = 'articles/' + imagePath.substring('uploaded/'.length);
  console.log('moving image', imagePath, 'to', newPath);
  const file = storage.bucket().file(imagePath);
  const placeholder = await getPlaiceholder(await file.download().then((res) => res[0])).catch((err) => {
    console.error('Error while generating placeholder', err);
    return null;
  });
  await file.move(newPath);
  return {
    uid: newPath,
    url: getPublicUrl(newPath),
    placeholderDataUrl: placeholder?.base64,
  };
}
