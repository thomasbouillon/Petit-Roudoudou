import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import type { Fabric } from '@couture-next/types';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Careful, do not update or delete fabric, this would create an infinite loop
export const onFabricWritten = onDocumentWritten(
  'fabrics/{docId}',
  async (event) => {
    const snapshotBefore = event.data?.before;
    const prevData = snapshotBefore?.data() as Omit<Fabric, '_id'> | undefined;
    const snapshotAfter = event.data?.after;
    const nextData = snapshotAfter?.data() as Omit<Fabric, '_id'> | undefined;

    if (!snapshotAfter || (prevData === undefined && nextData === undefined)) {
      console.warn('No data associated with the event');
      return;
    }

    const removedGroups =
      prevData?.groupIds.filter(
        (group) => !nextData?.groupIds.includes(group)
      ) ?? [];

    const addedGroups =
      nextData?.groupIds.filter(
        (group) => !prevData?.groupIds.includes(group)
      ) ?? [];

    // update groups
    const db = getFirestore();
    await Promise.all([
      ...removedGroups?.map((group) =>
        db.doc(`fabricGroups/${group}`).update({
          fabricIds: FieldValue.arrayRemove(
            snapshotBefore?.id || snapshotAfter?.id
          ),
        })
      ),
      ...addedGroups?.map((group) =>
        db.doc(`fabricGroups/${group}`).update({
          fabricIds: FieldValue.arrayUnion(
            snapshotBefore?.id || snapshotAfter?.id
          ),
        })
      ),
    ]);

    // move new uploaded images to fabrics folder
    // this will retrigger the function, but only once
    const storage = getStorage();
    if (nextData?.image.id.startsWith('uploaded/')) {
      const newPath =
        'fabrics/' + nextData.image.id.substring('uploaded/'.length);
      console.log('moving image', nextData.image.id, 'to', newPath);
      const file = storage.bucket().file(nextData.image.id);
      await file.move(newPath);
      const newFile = storage.bucket().file(newPath);
      nextData.image.id = newPath;
      nextData.image.url = newFile.publicUrl();
      await event.data?.after?.ref.set(nextData);
    }

    // delete old image
    if (prevData?.image && prevData.image.id !== nextData?.image.id) {
      const file = storage.bucket().file(prevData.image.id);
      console.log('deleting image', prevData.image.id);
      await file.delete();
    }
  }
);
