import { getStorage } from 'firebase-admin/storage';
import { onObjectFinalized } from 'firebase-functions/v2/storage';

export const onFileUploaded = onObjectFinalized(
  {
    bucket: 'petit-roudoudou-daae4.appspot.com',
  },
  async (event) => {
    const path = event.data.name;
    if (path.startsWith('uploaded/')) return;

    const storage = getStorage();
    await storage.bucket().file(path).setMetadata({
      cacheControl: 'public, max-age=31536000, s-maxage=31536000',
    });
  }
);
