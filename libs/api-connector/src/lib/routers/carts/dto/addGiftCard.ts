import { z } from 'zod';

export const addGiftCardPayloadSchema = z.object({
  type: z.literal('giftCard'),
  amount: z.number().min(0.01),
  recipient: z.object({ name: z.string().min(1), email: z.string().min(1) }),
  text: z.string(),
  imageDataUrl: z.string().min(1),
});
