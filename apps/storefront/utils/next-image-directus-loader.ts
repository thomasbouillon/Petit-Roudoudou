import { ImageLoader } from 'next/image';
import { loader as originalLoader } from './next-image-firebase-storage-loader';
import env from '../env';

let baseUrl = env.CDN_BASE_URL;
if (!baseUrl.endsWith('/') && !baseUrl.endsWith('%2F')) {
  baseUrl += '/';
}

export const loader: ImageLoader = ({ src, width, quality }) => {
  if (src.startsWith('/')) src = src.slice(1);
  return originalLoader({ src: `${baseUrl}${encodeURIComponent('cms/' + src)}?alt=media`, width, quality });
};
