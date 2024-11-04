import clsx from 'clsx';
import { useMemo } from 'react';

export function PrettyPrice({ price, currencySize }: { price: number; currencySize?: 'normal' | 'big' }) {
  const [units, cents] = useMemo(() => {
    const priceRef = price;
    return [
      Math.floor(priceRef).toString(),
      Math.round((priceRef - Math.floor(priceRef) + Number.EPSILON) * 100)
        .toString()
        .padStart(2, '0'),
    ];
  }, [price]);

  return (
    <>
      <span className="sr-only">Prix: {price}</span>
      <span className="block font-bold relative text-xs mr-2" aria-hidden>
        <span className="text-2xl">{units}</span>.{cents}
        <span className={clsx('top-0 absolute', currencySize === 'big' && 'text-base')}>€</span>
      </span>
    </>
  );
}
