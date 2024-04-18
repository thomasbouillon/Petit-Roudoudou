import { z } from 'zod';
import { CartItem } from '@couture-next/types';

export * from './addCustomizedArticle';
export * from './addGiftCard';
export * from './addInStockArticle';

export const addToCartPayloadSchema = z
  .object({
    type: z.enum(['customized', 'inStock', 'giftCard'] as const satisfies readonly CartItem['type'][]),
  })
  .passthrough();
