import { getStorage } from 'firebase-admin/storage';
import { onObjectDeleted } from 'firebase-functions/v2/storage';
import env from './env';
import { shouldBeInCdn } from '@couture-next/utils';

export const onFileDeleted = onObjectDeleted(
  {
    bucket: 'petit-roudoudou-daae4.appspot.com',
  },
  async (event) => {
    const path = event.data.name;
    if (!shouldBeInCdn(path)) return;

    const storage = getStorage();
    const fileRef = storage
      .bucket(env.CDN_BUCKET_NAME)
      .file(env.CDN_BUCKET_DIR ? `${env.CDN_BUCKET_DIR}/${path}` : path);
    if (await fileRef.exists().then((res) => res[0])) await fileRef.delete();
  }
);
