import { UseFormRegister } from 'react-hook-form';
import { FinalizeFormType } from './page';
import { useCart } from '../../../contexts/CartContext';
import React, { useMemo } from 'react';
import ManufacturingTimes from '../../manufacturingTimes';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import useSetting from 'apps/storefront/hooks/useSetting';

type Props = {
  register: UseFormRegister<FinalizeFormType>;
};

export default function Extras({ register }: Props) {
  const { getCartQuery } = useCart();
  if (getCartQuery.isError) throw getCartQuery.error;
  if (getCartQuery.isFetching) return null;

  const containsCustomizedItems = useMemo(
    () => getCartQuery.data?.items.some((item) => item.type === 'customized'),
    [getCartQuery.data?.items]
  );

  const { getSettingValueQuery } = useSetting('allowNewOrdersWithReducedManufacturingTimes');

  if (getSettingValueQuery.isError) throw getSettingValueQuery.error;
  if (!containsCustomizedItems || getSettingValueQuery.isPending) return null;

  console.log('newOrderWithReducedManufacturingTimes', getSettingValueQuery.data);

  return (
    <div className="mt-4">
      <h2 className="text-center underline">Suppléments</h2>
      {!getSettingValueQuery.data && (
        <small className="px-8 text-center block translate-y-2">
          Les commandes urgentes ne sont pas disponibles pour le moment.
        </small>
      )}
      <label
        className={clsx(
          'relative mt-2 py-2 pl-4 pr-2 sm:pr-8',
          'border rounded-md',
          'grid sm:grid-cols-[1fr_auto] items-center gap-4',
          'focus-within:outline outline-1',
          !getSettingValueQuery.data && 'opacity-50 pointer-events-none'
        )}
      >
        <input type="checkbox" className="peer sr-only" {...register('extras.reduceManufacturingTimes')} />
        <div>
          <span className="text-primary-100 font-bold">Command urgente</span>: Vous pouvez réduire les délais de
          confection à 2 semaines au lieu de <ManufacturingTimes as={React.Fragment} variant="max-delay-with-unit" />.
        </div>
        <div className="text-center">+15€</div>
        <CheckCircleIcon
          className={clsx(
            'peer-checked:opacity-100 opacity-0',
            'w-6 h-6 text-primary-100',
            'absolute left-full top-1/2 -translate-y-1/2 translate-x-2',
            'md:left-auto md:right-2 md:translate-x-0'
          )}
        />
      </label>
    </div>
  );
}
