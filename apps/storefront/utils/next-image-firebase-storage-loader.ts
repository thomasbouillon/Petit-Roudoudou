'use client';

import { ImageLoader } from 'next/image';

let supportsWebp = true;

function check_webp_feature(
  feature: 'lossy' | 'lossless' | 'alpha',
  callback: (result: boolean) => void
) {
  const kTestImages = {
    lossy: 'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
    lossless: 'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==',
    alpha:
      'UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA==',
  };
  const img = new window.Image();
  img.onload = function () {
    const result = img.width > 0 && img.height > 0;
    callback(result);
  };
  img.onerror = function () {
    callback(false);
  };
  img.src = 'data:image/webp;base64,' + kTestImages[feature];
}

if (typeof window !== 'undefined')
  Promise.all(
    (['lossy', 'lossless', 'alpha'] as const).map(
      (feat) => new Promise((res) => check_webp_feature(feat, res))
    )
  )
    .then((supports) => supports.every(Boolean))
    .then((canUseWebp) => {
      supportsWebp = canUseWebp;
    });

export const loader: ImageLoader = ({ src, width }) => {
  if (width >= 512) width = 512;
  else if (width >= 256) width = 256;
  else if (width >= 128) width = 128;
  else width = 64;
  const url = new URL(src);
  const withOutExt = url.pathname.split('.').slice(0, -1).join('.');
  const supportedExt = supportsWebp ? 'webp' : 'png';
  url.pathname = `${withOutExt}_${width}x${width * 2}.${supportedExt}`;
  return url.toString();
};

export const originalImageLoader: ImageLoader = ({ src }) => {
  return src;
};
