import { UseFormSetValue } from 'react-hook-form';
import { FinalizeFormType } from './page';
import { RadioGroup } from '@headlessui/react';
import Image from 'next/image';
import clsx from 'clsx';
import { HTMLProps } from 'react';

const SHIPPING_METHODS = {
  colissimo: {
    label: 'Colissimo',
    iconUri: '/images/colissimo.jpg',
  },
  mondialrelay: {
    label: 'Mondial Relay',
    iconUri: '/images/mondialrelay.svg',
  },
} satisfies {
  [key in FinalizeFormType['shipping']['method']]: {
    label: string;
    iconUri: string;
  };
};

type Props = {
  setValue: UseFormSetValue<FinalizeFormType>;
} & HTMLProps<HTMLDivElement>;

export default function ShippingMethods({ setValue, ...htmlProps }: Props) {
  return (
    <RadioGroup
      {...htmlProps}
      as="div"
      ref={undefined}
      className={clsx(htmlProps.className, 'grid md:grid-cols-2 max-w-lg gap-4 mt-8 w-full')}
      onChange={(value) => setValue('shipping.method', value as FinalizeFormType['shipping']['method'])}
    >
      <RadioGroup.Label className="col-span-full text-center underline" as="h2">
        Choix du mode de livraison
      </RadioGroup.Label>
      {Object.entries(SHIPPING_METHODS).map(([methodKey, method]) => (
        <RadioGroup.Option
          key={methodKey}
          value={methodKey}
          className="btn-secondary border-current ui-not-checked:text-black flex items-center gap-4"
        >
          <Image unoptimized src={method.iconUri} alt="" aria-hidden width={32} height={32} className="w-8 h-8" />
          <span>{method.label}</span>
        </RadioGroup.Option>
      ))}
    </RadioGroup>
  );
}
