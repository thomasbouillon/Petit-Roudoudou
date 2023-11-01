import { Article } from '@couture-next/types';
import { getStorage } from 'firebase-admin/storage';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

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
      if (image.id.startsWith('uploaded/')) {
        allStoragePromises.push(
          (async () => {
            console.log('Changed image');
            const newPath =
              'articles/' + image.id.substring('uploaded/'.length);
            console.log('moving image', image.id, 'to', newPath);
            const file = storage.bucket().file(image.id);
            await file.move(newPath);
            const newFile = storage.bucket().file(newPath);
            nextData.images[i].id = newPath;
            nextData.images[i].url = newFile.publicUrl();
            return null;
          })()
        );
      }
    }) ?? [];

    // 3D model
    if (nextData?.treeJsModel.id.startsWith('uploaded/')) {
      console.log('3D model', nextData.treeJsModel.id);
      allStoragePromises.push(
        (async () => {
          const newPath =
            'articles/' + nextData.treeJsModel.id.substring('uploaded/'.length);
          console.log('moving image', nextData.treeJsModel.id, 'to', newPath);
          const file = storage.bucket().file(nextData?.treeJsModel.id);
          await file.move(newPath);
          const newFile = storage.bucket().file(newPath);
          nextData.treeJsModel.id = newPath;
          nextData.treeJsModel.url = newFile.publicUrl();
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
        (image) => !nextData?.images.find((img) => img.id === image.id)
      ) ?? [];
    await Promise.all(
      removedImages.map(async (image) => {
        console.log('Removed image', image.id);
        const file = storage.bucket().file(image.id);
        if (await file.exists()) await file.delete();
      })
    );

    // remove deleted 3D model
    if (
      prevData?.treeJsModel.id &&
      prevData.treeJsModel.id !== nextData?.treeJsModel.id
    ) {
      console.log('Removed 3D model', prevData.treeJsModel.id);
      const file = storage.bucket().file(prevData.treeJsModel.id);
      if (await file.exists()) await file.delete();
    }
  }
);
