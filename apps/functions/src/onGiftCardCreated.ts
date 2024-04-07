import { GiftCard, SafeOmit } from '@couture-next/types';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

export const onGiftCardCreated = onDocumentCreated('giftCards/{docId}', async (event) => {
  const snapshotAfter = event.data;
  const nextData = snapshotAfter?.data() as SafeOmit<GiftCard, '_id'> | undefined;
  if (!nextData) return;

  // gift card created, find corresponding user if exists
  if (snapshotAfter && nextData.status === 'unclaimed') {
    const user = await getAuth()
      .getUserByEmail(nextData.userEmail)
      .catch(() => null);
    if (!user) {
      console.info(`No user found for email ${nextData.userEmail}, gift card remains unclaimed`);
      return;
    }
    // Claim gift card
    await getFirestore()
      .collection('giftCards')
      .doc(snapshotAfter.id)
      .set({ userId: user.uid, status: 'claimed', userEmail: FieldValue.delete() }, { merge: true });
    console.info(`Gift card ${snapshotAfter.id} claimed by user ${user.uid}`);
  }
});
