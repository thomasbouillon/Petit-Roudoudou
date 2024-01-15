import { Cart } from '@couture-next/types';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { deleteImageWithSizeVariants } from './utils';

export const onCartWritten = onDocumentWritten('carts/{docId}', async (event) => {
  const snapshotBefore = event.data?.before;
  const prevData = snapshotBefore?.data() as Omit<Cart, '_id'> | undefined;
  const snapshotAfter = event.data?.after;
  const nextData = snapshotAfter?.data() as Omit<Cart, '_id'> | undefined;

  const nextImages = nextData?.items.map((item) => item.image.uid);
  const prevImages = prevData?.items.map((item) => item.image.uid);

  const deletedImages = prevImages?.filter((image) => !nextImages?.includes(image));

  if (deletedImages && deletedImages.length > 0) {
    await Promise.all([deletedImages.map((image) => deleteImageWithSizeVariants(image))]);
  }
});
