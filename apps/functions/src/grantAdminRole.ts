import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { auth } from 'firebase-admin';

export const grantAdminRole = onDocumentCreated(
  'set-admin/{docId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.warn('No data associated with the event');
      return;
    }
    const data = snapshot.data();
    if (!data.email) {
      console.warn('Could not find email in data');
      return;
    }

    const user = await auth().getUserByEmail(data.email);

    await auth().setCustomUserClaims(user.uid, { admin: true });

    console.log('Successfully granted admin role to ' + data.email);

    await snapshot.ref.update({ status: 'success' });
  }
);
