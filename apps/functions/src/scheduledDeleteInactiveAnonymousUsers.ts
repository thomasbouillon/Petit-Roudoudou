import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';
import { GetUsersResult, UserRecord, getAuth } from 'firebase-admin/auth';
import type { FirebaseAuthError } from 'firebase-admin/lib/utils/error';

export const scheduledDeleteInactiveAnonymousUsers = onSchedule(
  {
    schedule: '0 0 * * *',
    timeZone: 'Europe/Paris',
  },
  async () => {
    const firestore = getFirestore();
    const auth = getAuth();
    const toDelete = await firestore
      .collection('carts-metadata')
      .where(
        'updatedAt',
        '<',
        Date.now() - 1000 * 60 * 60 * 24 * 30 // 30 days
      )
      .get();

    const annoUserIds = [] as string[];
    const maxBatchSize = 100;

    console.debug('Found', toDelete.docs.length, 'Old carts, checking users...');
    if (toDelete.docs.length === 0) return;

    for (let i = 0; i < toDelete.docs.length; i += maxBatchSize) {
      // Prepare
      const batch = firestore.batch();
      const docSlice = toDelete.docs.slice(i, i + maxBatchSize).map((doc) => doc.id);
      let getUsersRes: GetUsersResult | null = null;
      try {
        console.debug('Fetching users', i, i + maxBatchSize);
        getUsersRes = await auth.getUsers(docSlice.map((id) => ({ uid: id })));
        console.debug('Fetched', getUsersRes.users.length, 'users');
      } catch (e: unknown) {
        if (isFirebaseAuthError(e)) {
          console.error(`Error fetching users (${i}, ${i + maxBatchSize})`, e);
          continue;
        } else {
          throw e;
        }
      }

      if (!getUsersRes) throw 'Impossible';

      // Users by id
      const users = getUsersRes.users.reduce((acc, user) => {
        acc[user.uid] = user;
        return acc;
      }, {} as Record<string, UserRecord>);

      const annonymouseCartIds = docSlice.filter((id) => users[id]?.email === undefined);
      if (!annonymouseCartIds.length) {
        console.debug('No anonymous users in this batch');
        continue;
      }

      // Build batch for deleting carts
      annonymouseCartIds.forEach((id) => {
        annoUserIds.push(id);
        batch.delete(firestore.collection('carts').doc(id));
      });

      // Execute
      const res = await batch.commit();
      console.info('Deleted', res.length, 'anonymous user carts');
    }

    // Delete users
    const maxAuthBatchSize = 500;
    for (let i = 0; i < annoUserIds.length; i += maxAuthBatchSize) {
      if (i > 0) await new Promise((resolve) => setTimeout(resolve, 2000)); // Avoid rate limiting
      const slice = annoUserIds.slice(i, i + maxAuthBatchSize);
      const res = await auth.deleteUsers(slice);
      console.info('Deleted', res.successCount, 'anonymous users');
      if (res.failureCount > 0) {
        console.error('Failed to delete', res.failureCount, 'anonymous users');
        console.error('First 10 Errors:', res.errors.slice(0, 10));
      }
    }

    console.debug('Done');
  }
);

function isFirebaseAuthError(error: unknown): error is FirebaseAuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code.startsWith('auth/')
  );
}
