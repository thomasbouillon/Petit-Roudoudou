import { PromotionCode } from '@couture-next/types';
import env from './env';

const baseUrl = env.STORAGE_BASE_URL;

export function getPublicUrl(path: string) {
  path = encodeURIComponent(path);
  return `${baseUrl}/${path}?alt=media`;
}

export function getPromotionCodeDiscount<T extends Pick<PromotionCode, 'type' | 'discount'>>(
  code: T,
  totalTaxIncluded: number
) {
  if (code.type === 'freeShipping') return 0;
  if (code.discount === undefined) throw new Error('Discount is undefined');
  return code.type === 'percentage'
    ? totalTaxIncluded * (code.discount / 100)
    : Math.min(code.discount, totalTaxIncluded);
}
