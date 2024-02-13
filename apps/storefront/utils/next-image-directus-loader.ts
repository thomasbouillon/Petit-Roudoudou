import { ImageLoader } from 'next/image';
import { loader as originalLoader } from './next-image-firebase-storage-loader';
import env from '../env';

const baseUrl = env.CDN_BASE_URL;

export const loader: ImageLoader = ({ src, width, quality }) => {
  if (src.startsWith('/')) src = src.slice(1);
  return originalLoader({ src: `${baseUrl}/${encodeURIComponent('cms/' + src)}?alt=media`, width, quality });
};
