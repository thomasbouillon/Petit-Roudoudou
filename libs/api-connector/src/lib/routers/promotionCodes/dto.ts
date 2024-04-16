import { z } from 'zod';

export const promotionCodeSchema = z.intersection(
  z.object({
    code: z.string().min(1),
    conditions: z.object({
      minAmount: z.number().min(0).optional(),
      until: z.date().optional(),
      usageLimit: z.number().min(0).optional(),
    }),
  }),
  z.union([
    z.object({
      type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
      discount: z.number().min(0).max(100),
      filters: z.object({
        category: z.enum(['IN_STOCK', 'CUSTOMIZED']).optional(),
        articleId: z.string().min(1).optional(),
      }),
    }),
    z
      .object({
        type: z.enum(['FREE_SHIPPING']),
      })
      .transform((val) => ({ ...val, discount: null, filters: null })),
  ])
); // TODO satisfies PromotionCode A or B
