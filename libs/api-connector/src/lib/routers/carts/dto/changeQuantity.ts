import { z } from 'zod';

export const changeQuantityPayloadSchema = z.object({
  itemUid: z.string(),
  newQuantity: z.number().int().min(0),
});
