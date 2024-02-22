'use client';

import env from '../env';

import { firebaseServerImageLoader } from '@couture-next/utils';

export { originalImageLoader } from '@couture-next/utils';

export const loader = firebaseServerImageLoader({ cdnBaseUrl: env.CDN_BASE_URL });
