import { publicProcedure } from '../../trpc';
import { isAdmin } from '../../middlewares/isAdmin';

export default publicProcedure.use(isAdmin()).query(async ({ ctx }) => {
  const now = new Date();

  const upperBoundary = new Date(`${now.getFullYear()}-${now.getMonth() + 2}-01`);
  const lowerBoundary = new Date();
  lowerBoundary.setMonth(lowerBoundary.getMonth() - 6);
  lowerBoundary.setDate(0);
  lowerBoundary.setHours(0, 0, 0, 0);

  const details = await ctx.orm.$runCommandRaw({
    aggregate: 'Order',
    cursor: {},
    pipeline: [
      {
        $match: {
          paidAt: {
            $gte: { $date: lowerBoundary.toISOString() },
            $lt: { $date: upperBoundary.toISOString() },
          },
        },
      },
      {
        $group: {
          _id: null,
          avgTotalTaxIncluded: { $avg: '$totalTaxIncluded' },
        },
      },
    ],
  });

  if (!('cursor' in details)) throw new Error('Invalid response from MongoDB');
  if (!('firstBatch' in (details['cursor'] as object))) throw new Error('Invalid response from MongoDB');
  const res = (details as any).cursor.firstBatch as { avgTotalTaxIncluded: number }[];
  if (res.length === 0) throw new Error('No data found');
  return res[0].avgTotalTaxIncluded;
});
