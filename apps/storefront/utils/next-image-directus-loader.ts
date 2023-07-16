import { ImageLoader } from 'next/image';
import env from '../env';

const loaderBaseUrl = env.DIRECTUS_ASSETS_URL.replace(/\/$/, '');

export const loader: ImageLoader = ({ src, width, quality }) => {
  if (src.startsWith('/')) src = src.slice(1);
  return `${loaderBaseUrl}/${src}?width=${width}&quality=${quality || 75}`;
};
