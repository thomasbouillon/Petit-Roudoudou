import { Field } from '@couture-next/ui/form/Field';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import { ArticleFormType } from '../form';
import { PencilIcon } from '@heroicons/react/24/solid';

type Props = {
  stockIndex: number;
};

export default function Overrides({ stockIndex }: Props) {
  return (
    <Field
      label="Prix"
      widgetId="overrides.price"
      renderWidget={(className) => (
        <div className={className}>
          <div className="flex items-center justify-between">
            <div>
              <OriginalPrice stockIndex={stockIndex} />
              <OverridedPrice stockIndex={stockIndex} />
            </div>
            <Popover>
              <PopoverButton>
                <PencilIcon className="w-8 h-8 p-1" />
              </PopoverButton>
              <PopoverPanel anchor="bottom" className="bg-white shadow-md grid border px-4 py-2">
                Prix pour promotion HT
                <PriceOverrideWidget stockIndex={stockIndex} />
              </PopoverPanel>
            </Popover>
          </div>
        </div>
      )}
    />
  );
}

function OriginalPrice({ stockIndex }: { stockIndex: number }) {
  const linkedSkuUid = useWatch<ArticleFormType, `stocks.${number}.sku`>({
    name: `stocks.${stockIndex}.sku`,
  });
  const skus = useWatch<ArticleFormType, 'skus'>({
    name: 'skus',
  });
  const linkedSku = skus.find((sku) => sku.uid === linkedSkuUid);
  const originalPrice = linkedSku?.price ?? '-';

  return <p>Prix de base HT: {originalPrice} €</p>;
}

function OverridedPrice({ stockIndex }: { stockIndex: number }) {
  const overridedPrice = useWatch<ArticleFormType, `stocks.${number}.overrides.price`>({
    name: `stocks.${stockIndex}.overrides.price`,
  });
  const error = useFormState<ArticleFormType>().errors.stocks?.[stockIndex]?.overrides?.price;
  if (error) return <p className="text-red-500">{error.message}</p>;
  if (typeof overridedPrice !== 'number') return null;
  return <p>En promotion: {overridedPrice} €</p>;
}

function PriceOverrideWidget({ stockIndex }: { stockIndex: number }) {
  const { register, setValue } = useFormContext<ArticleFormType>();
  const field = register(`stocks.${stockIndex}.overrides.price`, { valueAsNumber: true });

  return (
    <input
      {...field}
      onChange={(e) =>
        e.target.value === '' ? setValue(`stocks.${stockIndex}.overrides.price`, undefined) : field.onChange(e)
      }
      type="number"
      className="px-2 py-4 border rounded-sm"
    />
  );
}
