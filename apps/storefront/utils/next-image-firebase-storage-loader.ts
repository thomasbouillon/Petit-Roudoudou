import { ImageLoader } from 'next/image';

export const loader: ImageLoader = ({ src, width }) => {
  console.log('loader', src, width);

  if (width >= 512) width = 512;
  else if (width >= 256) width = 256;
  else if (width >= 128) width = 128;
  else width = 64;
  const url = new URL(src);
  url.pathname = `${url.pathname}_${width}x${width}`;
  return url.toString();
};
