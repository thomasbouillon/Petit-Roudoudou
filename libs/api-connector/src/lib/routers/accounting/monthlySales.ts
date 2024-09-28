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
        $addFields: {
          year: { $year: '$paidAt' },
          month: { $month: '$paidAt' },
        },
      },
      {
        $group: {
          _id: {
            method: '$billing.paymentMethod',
            year: '$year',
            month: '$month',
          },
          totalTaxIncluded: { $sum: '$totalTaxIncluded' },
          totalShipping: { $sum: '$shipping.price.taxIncluded' },
          extras: { $sum: '$extras.reduceManufacturingTimes.priceTaxIncluded' },
          count: { $count: {} },
        },
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month',
          },
          groupedByPaymentMethods: {
            $push: {
              paymentMethod: '$_id.method',
              totalTaxIncluded: '$totalTaxIncluded',
              count: '$count',
            },
          },
          totalTaxIncluded: { $sum: '$totalTaxIncluded' },
          totalShipping: { $sum: '$totalShipping' },
          extras: { $sum: '$extras' },
          count: { $sum: '$count' },
        },
      },
      {
        $sort: {
          '_id.year': -1,
          '_id.month': -1,
        },
      },
    ],
  });

  if (!('cursor' in details)) throw new Error('Invalid response from MongoDB');
  if (!('firstBatch' in (details['cursor'] as object))) throw new Error('Invalid response from MongoDB');
  return (details as any).cursor.firstBatch as {
    _id: {
      year: number;
      month: number;
    };
    groupedByPaymentMethods: {
      paymentMethod: string;
      totalTaxIncluded: number;
      count: number;
    }[];
    totalTaxIncluded: number;
    totalShipping: number;
    extras: number;
    count: number;
  }[];
});
