import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';

export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  if (user.email) {
    // check for gift cards to claim
    const cardsToClaim = await getFirestore().collection('giftCards').where('userEmail', '==', user.email).get();
    await Promise.all(
      cardsToClaim.docs.map(
        async (doc) => {
          await doc.ref.set({ userId: user.uid, status: 'claimed', userEmail: FieldValue.delete() }, { merge: true });
        },
        { merge: true }
      )
    ).catch((e) => console.error('Error claiming gift cards:', e));
  }
});
