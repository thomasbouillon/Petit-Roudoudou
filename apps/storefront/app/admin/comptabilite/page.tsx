'use client';

import { TRPCRouterOutput } from '@couture-next/api-connector';
import { Order } from '@prisma/client';
import { trpc } from 'apps/storefront/trpc-client';
import clsx from 'clsx';

type MonthDetails = TRPCRouterOutput['accounting']['monthlySales'][number];

export default function Page() {
  const accountingDetails = trpc.accounting.monthlySales.useQuery();
  const averageOrderPrice = trpc.accounting.averageOrderPrice.useQuery();

  const headerClassName = 'text-end px-2 py-1 border border-gray-300';
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h1 className="text-center font-serif text-3xl">Comptabilité</h1>

        <p className="text-center">Toutes les valeurs sont TTC</p>
      </div>
      <section>
        <h2 className="text-center text-2xl font-serif">Panier moyen</h2>
        <p className="text-center">
          Le panier moyen des 6 derniers mois est de{' '}
          <strong>{averageOrderPrice.data ? averageOrderPrice.data.toFixed(2) : 'Chargement...'} €</strong>
        </p>
      </section>
      <section>
        <h2 className="text-center text-2xl font-serif mb-2">Performances mensuelles</h2>
        <table className="mx-auto">
          <thead>
            <tr>
              <th className={headerClassName}>Période</th>
              <th className={headerClassName}>Nombre commandes</th>
              <th className={headerClassName}>Nombre urgents</th>
              <th className={headerClassName}>CA hors FdP & Suppl Urgent</th>
              <th className={headerClassName}>CA hors FdP</th>
              <th className={headerClassName}>CA total</th>
              <th className={clsx(headerClassName, '!text-start')} colSpan={3}>
                Détails
              </th>
            </tr>
          </thead>
          <tbody>
            {accountingDetails.data?.map((monthDetails) => (
              <Row key={monthDetails._id.month + '-' + monthDetails._id.year} monthDetails={monthDetails} />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Row({ monthDetails }: { monthDetails: MonthDetails }) {
  let paidByCard = {
      count: 0,
      totalTaxIncluded: 0,
    },
    paidByBankTransfer = {
      count: 0,
      totalTaxIncluded: 0,
    },
    paidByGiftCard = {
      count: 0,
      totalTaxIncluded: 0,
    };

  for (const detailsByPaymentMethod of monthDetails.groupedByPaymentMethods) {
    if (detailsByPaymentMethod.paymentMethod === ('CARD' satisfies Order['billing']['paymentMethod'])) {
      paidByCard = detailsByPaymentMethod;
    } else if (detailsByPaymentMethod.paymentMethod === ('BANK_TRANSFER' satisfies Order['billing']['paymentMethod'])) {
      paidByBankTransfer = detailsByPaymentMethod;
    } else if (detailsByPaymentMethod.paymentMethod === ('GIFT_CARD' satisfies Order['billing']['paymentMethod'])) {
      paidByGiftCard = detailsByPaymentMethod;
    } else {
      throw new Error('Unknown payment method');
    }
  }

  const withReduceManufacturingTimesExtraCount = monthDetails.extras / 15; // TODO edit when adding taxes or changing ReduceManufacturingTimes price

  const cellClassName = 'text-end px-2 py-1 border border-gray-300  text-nowrap';

  return (
    <tr>
      <td className={cellClassName}>
        {new Date(monthDetails._id.year, monthDetails._id.month - 1).toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        })}
      </td>
      <td className={cellClassName}>{monthDetails.count}</td>
      <td className={cellClassName}>{withReduceManufacturingTimesExtraCount}</td>
      <td className={cellClassName}>
        {(monthDetails.totalTaxIncluded - monthDetails.extras - monthDetails.totalShipping).toFixed(2)} €
      </td>
      <td className={cellClassName}>{(monthDetails.totalTaxIncluded - monthDetails.totalShipping).toFixed(2)} €</td>
      <td className={clsx(cellClassName, 'text-primary-100 font-bold')}>
        {monthDetails.totalTaxIncluded.toFixed(2)} €
      </td>
      <td className={cellClassName}>
        <div className="flex justify-between gap-2">
          <span className="text-gray-500">CB: </span>
          {paidByCard.totalTaxIncluded} € ({paidByCard.count})
        </div>
      </td>
      <td className={cellClassName}>
        <div className="flex justify-between gap-2">
          <span className="text-gray-500">Virement: </span>
          {paidByBankTransfer.totalTaxIncluded} € ({paidByBankTransfer.count})
        </div>
      </td>
      <td className={cellClassName}>
        <div className="flex justify-between gap-2">
          <span className="text-gray-500">Autre: </span>
          {paidByGiftCard.totalTaxIncluded} € ({paidByGiftCard.count})
        </div>
      </td>
    </tr>
  );
}
