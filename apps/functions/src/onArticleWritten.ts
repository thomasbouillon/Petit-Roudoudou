import { Article, Cart } from '@couture-next/types';
import { getStorage } from 'firebase-admin/storage';
import { AggregateField, FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { deleteImageWithSizeVariants, getPublicUrl } from './utils';
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
    console.log("Updating article's aggregated rating");
    const aggregateSnapshot = await getFirestore()
      .collection('reviews')
      .where('articleId', '==', snapshotAfter.id)
      .aggregate({
        avgScore: AggregateField.average('score'),
      })
      .get();
    const avgScore = aggregateSnapshot.data().avgScore;
    console.debug('Aggregated rating:', avgScore);

    if (avgScore !== null) {
      nextData.aggregatedRating = avgScore;
    } else {
      delete nextData.aggregatedRating;
    }

    await snapshotAfter.ref.set(
      { aggregatedRating: avgScore === null ? FieldValue.delete() : avgScore },
      { merge: true }
    );
  }

  // If decreased stock, remove from carts where quantity is too high
  if (snapshotAfter && nextData && prevData?.stocks && nextData.stocks) {
    const firestore = getFirestore();

    const reducedStocks = nextData.stocks
      // Find stocks where stock is decreased
      .filter((stock) => {
        const prevStock = prevData.stocks.find((s) => s.uid === stock.uid);
        if (!prevStock) return false;
        return stock.stock < prevStock.stock;
      })
      // append stocks that have been removed
      .concat(prevData.stocks.filter((stock) => nextData.stocks.find((s) => s.uid === stock.uid) === undefined));

    if (reducedStocks.length > 0) {
      console.debug(
        'Reduced stocks:',
        reducedStocks.map((s) => s.uid)
      );

      const cartsSnapshot = await firestore
        .collection('carts')
        .where('articleIds', 'array-contains', snapshotAfter.id)
        .get();

      await Promise.all(
        cartsSnapshot.docs.map(async (cartDoc) => {
          const cart = cartDoc.data() as Cart;
          let nextItems = [...cart.items];
          for (const reducedStock of reducedStocks) {
            let quantityInCart = 0;
            for (let i = 0; i < cart.items.length; i++) {
              const item = cart.items[i];
              if (item.stockUid !== reducedStock.uid) continue;
              if (quantityInCart + item.quantity > reducedStock.stock) {
                const newQuantity = reducedStock.stock - quantityInCart;
                nextItems[i].quantity = newQuantity;
                quantityInCart += newQuantity;
              } else {
                quantityInCart += item.quantity;
              }
            }
          }
          nextItems = nextItems.filter((item) => item.quantity > 0);
          await cartDoc.ref.set({ items: nextItems }, { merge: true });
        })
      );
    }
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

  console.log('allStoragePromises', allStoragePromises.length, 'promises found !');

  // 3D model
  if (nextData?.threeJsModel.uid.startsWith('uploaded/')) {
    console.log('3D model', nextData.threeJsModel.uid);
    allStoragePromises.push(
      (async () => {
        const newPath = 'articles/' + nextData.threeJsModel.uid.substring('uploaded/'.length);
        console.log('moving image', nextData.threeJsModel.uid, 'to', newPath);
        const file = storage.bucket().file(nextData?.threeJsModel.uid);
        await file.move(newPath);
        nextData.threeJsModel.uid = newPath;
        nextData.threeJsModel.url = getPublicUrl(newPath);
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
      await deleteImageWithSizeVariants(image.uid);
    })
  );

  // remove deleted 3D model
  if (prevData?.threeJsModel.uid && prevData.threeJsModel.uid !== nextData?.threeJsModel.uid) {
    console.log('Removed 3D model', prevData.threeJsModel.uid);
    const file = storage.bucket().file(prevData.threeJsModel.uid);
    if (await file.exists().then((res) => res[0])) await file.delete();
  }

  // UpdatedAt
  const firestore = getFirestore();
  if (snapshotAfter) {
    // updated or created
    await firestore.collection('articles-metadata').doc(snapshotAfter.id).set({ updatedAt: Date.now() });
  } else if (snapshotBefore) {
    // deleted
    await firestore.collection('articles-metadata').doc(snapshotBefore?.id).delete();
  }
});

async function handleArticleImage(imagePath: string) {
  console.log('Changed image');
  const storage = getStorage();
  const prevPath = imagePath;
  const newPath = 'articles/' + imagePath.substring('uploaded/'.length);
  console.log('moving image', imagePath, 'to', newPath);
  const file = storage.bucket().file(imagePath);
  const imageContent = await file.download().then((res) => res[0]);
  const [placeholder] = await Promise.all([
    getPlaiceholder(imageContent).catch((err) => {
      console.error('Error while generating placeholder', err);
      return null;
    }),
    file.move(newPath).then(() => deleteImageWithSizeVariants(prevPath)),
  ]);
  return {
    uid: newPath,
    url: getPublicUrl(newPath),
    placeholderDataUrl: placeholder?.base64,
  };
}
