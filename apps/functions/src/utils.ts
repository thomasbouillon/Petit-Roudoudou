import { PromotionCode } from '@prisma/client';
import { Storage, getStorage } from 'firebase-admin/storage';

export function getPromotionCodeDiscount<T extends Pick<PromotionCode, 'type' | 'discount'>>(
  code: T,
  subTotalTaxIncludedWithOutGiftCardItems: number
) {
  if (code.type === 'FREE_SHIPPING') return 0;
  if (code.discount === null) throw new Error('Discount is null');
  return code.type === 'PERCENTAGE'
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
