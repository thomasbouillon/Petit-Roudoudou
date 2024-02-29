import { ImageLoader } from 'next/image';
import { shouldBeInCdn } from './cdn';

let supportsWebp = true;

function check_webp_feature(feature: 'lossy' | 'lossless' | 'alpha', callback: (result: boolean) => void) {
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
    (['lossy', 'lossless', 'alpha'] as const).map((feat) => new Promise((res) => check_webp_feature(feat, res)))
  )
    .then((supports) => supports.every(Boolean))
    .then((canUseWebp) => {
      supportsWebp = canUseWebp;
    });

export const firebaseServerImageLoader: (options?: { cdnBaseUrl?: string; preventOriginal?: boolean }) => ImageLoader =
  (options) =>
  ({ src, width }) => {
    src = prepareUrl(src, options?.cdnBaseUrl);
    if (width > 1400 && !options?.preventOriginal) return originalImageLoader({ src, width }); // original
    else if (width >= 1024) width = 1024;
    else if (width >= 512) width = 512;
    else if (width >= 256) width = 256;
    else if (width >= 128) width = 128;
    else width = 64;
    let url = new URL(src);
    const splitted = url.pathname.split('.');
    let withOutExt = splitted.length > 1 ? splitted.slice(0, -1).join('.') : url.pathname;
    const supportedExt = supportsWebp ? 'webp' : 'png';
    url.pathname = `${withOutExt}_${width}x${width * 2}.${supportedExt}`;
    return url.toString();
  };

export const originalImageLoader: ImageLoader = ({ src }) => {
  return src;
};

function prepareUrl(url: string, cdnBaseUrl?: string) {
  const urlObj = new URL(url);
  const pathInBucket = urlObj.pathname.split('/').pop() || urlObj.pathname; // path's '/' are encoded as %2F

  if (cdnBaseUrl && !cdnBaseUrl.endsWith('/') && !cdnBaseUrl.endsWith('%2F')) {
    cdnBaseUrl += '/';
  }

  console.log(cdnBaseUrl, pathInBucket);

  if (shouldBeInCdn(pathInBucket) && cdnBaseUrl) {
    return new URL(cdnBaseUrl + pathInBucket + urlObj.search).toString();
  } else if (shouldBeInCdn(pathInBucket) && !cdnBaseUrl) {
    console.warn('CDN_BASE_URL is not defined, but the image is in the CDN');
  }
  return url;
}
