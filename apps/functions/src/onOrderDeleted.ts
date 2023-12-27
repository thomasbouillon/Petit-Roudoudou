import { adminFirestoreOrderConverter } from '@couture-next/utils';
import { getStorage } from 'firebase-admin/storage';
import { onDocumentDeleted } from 'firebase-functions/v2/firestore';

// Careful, do not update or delete order, this would create an infinite loop
export const onOrderDeleted = onDocumentDeleted('orders/{docId}', async (event) => {
  const deletedOrderSnapshot = event.data;
  if (!deletedOrderSnapshot) return;

  const deletedOrder = adminFirestoreOrderConverter.fromFirestore(deletedOrderSnapshot);

  const storage = getStorage();

  // delete images
  await Promise.all(
    deletedOrder.items.map(async (item) => {
      console.log('Removed image', item.image.uid);
      const file = storage.bucket().file(item.image.uid);
      if (await file.exists().then((res) => res[0])) await file.delete();
    })
  );
});
