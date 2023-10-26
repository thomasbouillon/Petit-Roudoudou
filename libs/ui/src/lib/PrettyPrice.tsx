import { useMemo } from 'react';

export function PrettyPrice({ price }: { price: number }) {
  const [units, cents] = useMemo(() => {
    const priceRef = price;
    return [
      Math.floor(priceRef).toString().padStart(2, '0'),
      Math.floor((priceRef - Math.floor(priceRef)) * 100)
        .toString()
        .padStart(2, '0'),
    ];
  }, [price]);

  return (
    <>
      <p className="sr-only">Prix: {price}</p>
      <p className="font-bold relative text-xs mr-2" aria-hidden>
        <span className="text-3xl">{units}</span>.{cents}
        <span className="top-0 absolute">€</span>
      </p>
    </>
  );
}
