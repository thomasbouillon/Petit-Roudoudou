import { getStorage } from 'firebase-admin/storage';
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import env from './env';
import { shouldBeInCdn } from '@couture-next/utils';

export const onFileFinalized = onObjectFinalized(
  {
    bucket: 'petit-roudoudou-daae4.appspot.com',
  },
  async (event) => {
    const path = event.data.name;
    if (path.startsWith('uploaded/')) return;

    const storage = getStorage();
    const fileRef = storage.bucket().file(path);

    if (shouldBeInCdn(path)) {
      console.debug(`Copying ${path} to CDN(${env.CDN_BUCKET_NAME}/${env.CDN_BUCKET_DIR})`);
      const cdnBucketFileRef = storage
        .bucket(env.CDN_BUCKET_NAME)
        .file(env.CDN_BUCKET_DIR ? `${env.CDN_BUCKET_DIR}/${path}` : path);
      await fileRef.copy(cdnBucketFileRef);
      await cdnBucketFileRef.makePublic();
      await cdnBucketFileRef.setMetadata({
        cacheControl: 'public, max-age=31536000',
      });
    }
  }
);
