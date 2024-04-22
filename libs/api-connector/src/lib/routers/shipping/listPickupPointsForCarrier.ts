import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { BoxtalCarrier } from '@couture-next/shipping';

const allCarriers = {
  MONR: true,
  POFR: true,
} satisfies {
  [K in BoxtalCarrier]: true;
};

const additionalConstrainsSchema = z.object({
  carrierId: z.enum(Object.keys(allCarriers) as [BoxtalCarrier, ...BoxtalCarrier[]]),
  country: z.enum(['FR', 'BE', 'CH']),
  zipCode: z.string(),
});

export default publicProcedure.input(additionalConstrainsSchema).query(async ({ ctx, input }) => {
  return await ctx.shipping.listPickUpPoints(input);
});
