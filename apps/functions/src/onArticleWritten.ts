import { Article } from '@couture-next/types';
import { getStorage } from 'firebase-admin/storage';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getPublicUrl } from './utils';

// Careful, do not update or delete article, this would create an infinite loop
export const onArticleWritten = onDocumentWritten(
  'articles/{docId}',
  async (event) => {
    const snapshotBefore = event.data?.before;
    const prevData = snapshotBefore?.data() as Omit<Article, '_id'> | undefined;
    const snapshotAfter = event.data?.after;
    const nextData = snapshotAfter?.data() as Omit<Article, '_id'> | undefined;

    const storage = getStorage();

    // move new uploaded images to articles folder
    // this will retrigger the function, but only once
    const allStoragePromises = [];

    nextData?.images.forEach(async (image, i) => {
      if (image.uid.startsWith('uploaded/')) {
        allStoragePromises.push(
          (async () => {
            console.log('Changed image');
            const newPath =
              'articles/' + image.uid.substring('uploaded/'.length);
            console.log('moving image', image.uid, 'to', newPath);
            const file = storage.bucket().file(image.uid);
            await file.move(newPath);
            nextData.images[i].uid = newPath;
            nextData.images[i].url = getPublicUrl(newPath);
            return null;
          })()
        );
      }
    }) ?? [];

    // 3D model
    if (nextData?.treeJsModel.uid.startsWith('uploaded/')) {
      console.log('3D model', nextData.treeJsModel.uid);
      allStoragePromises.push(
        (async () => {
          const newPath =
            'articles/' +
            nextData.treeJsModel.uid.substring('uploaded/'.length);
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
        console.log('updating article with new paths', nextData);
        await event.data?.after?.ref.set(nextData);
      }
    });

    // remove deleted images
    const removedImages =
      prevData?.images.filter(
        (image) => !nextData?.images.find((img) => img.uid === image.uid)
      ) ?? [];
    await Promise.all(
      removedImages.map(async (image) => {
        console.log('Removed image', image.uid);
        const file = storage.bucket().file(image.uid);
        if (await file.exists()) await file.delete();
      })
    );

    // remove deleted 3D model
    if (
      prevData?.treeJsModel.uid &&
      prevData.treeJsModel.uid !== nextData?.treeJsModel.uid
    ) {
      console.log('Removed 3D model', prevData.treeJsModel.uid);
      const file = storage.bucket().file(prevData.treeJsModel.uid);
      if (await file.exists()) await file.delete();
    }
  }
);
