import { PromotionCode } from '@couture-next/types';
import env from './env';
import { Storage, getStorage } from 'firebase-admin/storage';

const baseUrl = env.STORAGE_BASE_URL;
let cdnBaseUrl = env.CDN_BASE_URL;

if (!cdnBaseUrl.endsWith('/') && !cdnBaseUrl.endsWith('%2F')) {
  cdnBaseUrl += '/';
}

export function getPublicUrl(path: string) {
  path = encodeURIComponent(path);

  if (path.startsWith('articles') || path.startsWith('fabrics') || path.startsWith('cms')) {
    return `${cdnBaseUrl}${path}?alt=media`;
  }

  return `${baseUrl}/${path}?alt=media`;
}

export function getPromotionCodeDiscount<T extends Pick<PromotionCode, 'type' | 'discount'>>(
  code: T,
  subTotalTaxIncludedWithOutGiftCardItems: number
) {
  if (code.type === 'freeShipping') return 0;
  if (code.discount === undefined) throw new Error('Discount is undefined');
  return code.type === 'percentage'
    ? subTotalTaxIncludedWithOutGiftCardItems * (code.discount / 100)
    : Math.min(code.discount, subTotalTaxIncludedWithOutGiftCardItems);
}

export async function deleteImageWithSizeVariants(path: string) {
  const size = [64, 128, 256, 512, 1024];
  const resizedExtensions = ['webp', 'png'];

  const splitted = path.split('.');
  const originalExt = splitted.pop();
  path = splitted.join('.');

  const storage = getStorage();
  const deletePromises = resizedExtensions.flatMap((ext) =>
    size.map((width) => deleteImage(storage, `${path}_${width}x${width * 2}.${ext}`))
  );

  deletePromises.push(deleteImage(storage, `${path}.${originalExt}`));

  await Promise.all(deletePromises);
}

async function deleteImage(storage: Storage, path: string) {
  const file = storage.bucket().file(path);
  if (await file.exists().then((res) => res[0])) await file.delete();
}
