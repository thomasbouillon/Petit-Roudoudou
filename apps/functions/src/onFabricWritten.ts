import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import type { Fabric } from '@couture-next/types';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { deleteImageWithSizeVariants, getPublicUrl } from './utils';
import { getPlaiceholder } from './vendor/plaiceholder';

// Careful, do not update or delete fabric, this would create an infinite loop
export const onFabricWritten = onDocumentWritten('fabrics/{docId}', async (event) => {
  const snapshotBefore = event.data?.before;
  const prevData = snapshotBefore?.data() as Omit<Fabric, '_id'> | undefined;
  const snapshotAfter = event.data?.after;
  const nextData = snapshotAfter?.data() as Omit<Fabric, '_id'> | undefined;

  if (!snapshotAfter || (prevData === undefined && nextData === undefined)) {
    console.warn('No data associated with the event');
    return;
  }

  const removedGroups = prevData?.groupIds.filter((group) => !nextData?.groupIds.includes(group)) ?? [];

  const addedGroups = nextData?.groupIds.filter((group) => !prevData?.groupIds.includes(group)) ?? [];

  // update groups
  const db = getFirestore();
  await Promise.all([
    ...removedGroups?.map((group) =>
      db.doc(`fabricGroups/${group}`).update({
        fabricIds: FieldValue.arrayRemove(snapshotBefore?.id || snapshotAfter?.id),
      })
    ),
    ...addedGroups?.map((group) =>
      db.doc(`fabricGroups/${group}`).update({
        fabricIds: FieldValue.arrayUnion(snapshotBefore?.id || snapshotAfter?.id),
      })
    ),
  ]);

  // move new uploaded images to fabrics folder
  // this will retrigger the function, but only once
  if (nextData) {
    await Promise.all([moveImageIfNecessary(nextData.image), moveImageIfNecessary(nextData.previewImage)]).then(
      ([nextImage, nextPreviewImage]) => {
        if (nextImage === null && nextPreviewImage === null) return;
        let toSet = {} as Partial<Fabric>;
        if (nextImage) toSet.image = nextImage;
        if (nextPreviewImage) toSet.previewImage = nextPreviewImage;
        return snapshotAfter.ref.set(toSet, { merge: true });
      }
    );
  }

  // delete old image
  if (prevData?.image && prevData.image.uid !== nextData?.image.uid) {
    console.log('deleting image', prevData.image.uid);
    await deleteImageWithSizeVariants(prevData.image.uid);
  }
  if (prevData?.previewImage && prevData.previewImage.uid !== nextData?.previewImage?.uid) {
    console.log('deleting image', prevData.previewImage.uid);
    await deleteImageWithSizeVariants(prevData.previewImage.uid);
  }
});

const moveImageIfNecessary = async (image: Fabric['previewImage' | 'image']) => {
  if (!image || !image.uid.startsWith('uploaded/')) return null;

  const storage = getStorage();
  const prevPath = image.uid;
  const newPath = 'fabrics/' + image.uid.substring('uploaded/'.length);
  console.log('moving image', image.uid, 'to', newPath);
  const file = storage.bucket().file(image.uid);
  const placeholder = await getPlaiceholder(await file.download().then((res) => res[0])).catch((err) => {
    console.error('Error while generating placeholder', err);
    return null;
  });
  await file.move(newPath);
  await deleteImageWithSizeVariants(prevPath);
  const nextImage = {
    uid: newPath,
    url: getPublicUrl(newPath),
  } as NonNullable<Fabric['image' | 'previewImage']>;
  if (placeholder) {
    nextImage.placeholderDataUrl = placeholder.base64;
  }
  return nextImage;
};
