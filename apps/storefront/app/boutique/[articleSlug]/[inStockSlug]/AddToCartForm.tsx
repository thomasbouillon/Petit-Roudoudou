'use client';

import { ButtonWithLoading, Field } from '@couture-next/ui';
import { useCart } from '../../../../contexts/CartContext';
import { Customizable } from '@couture-next/types';
import { Control, Controller, DefaultValues, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import clsx from 'clsx';
import { ErrorCodes, applyTaxes } from '@couture-next/utils';
import { Popover } from '@headlessui/react';
import { useMemo } from 'react';
import { TRPCRouterInput } from '@couture-next/api-connector';
import toast from 'react-hot-toast';
import { TRPCClientError } from '@trpc/client';

const schema = z.object({
  type: z.literal('inStock'),
  articleId: z.string(),
  stockUid: z.string(),
  customizations: z.record(z.union([z.string(), z.boolean()])),
}) satisfies z.ZodType<TRPCRouterInput['carts']['addToMyCart']>;

type SchemaType = z.infer<typeof schema>;

type CustomizableNotPart = Exclude<Customizable, { type: 'customizable-part' }>;

type Props = {
  defaultValues: DefaultValues<SchemaType>;
  customizables: CustomizableNotPart[];
  basePrice: number;
  outOfStock?: boolean;
};

export default function AddToCartForm({ defaultValues, customizables, outOfStock, basePrice }: Props) {
  const { addToCartMutation } = useCart();
  const form = useForm<SchemaType>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const choices = useWatch({ control: form.control, name: 'customizations', defaultValue: {} });
  const priceWithOptionsTaxExcluded = useMemo(
    () =>
      basePrice +
      Object.entries(choices).reduce((acc, [customizableUid, value]) => {
        if (!value) return acc;
        const customizable = customizables.find((customizable) => customizable.uid === customizableUid);
        if (!customizable) return acc;
        return acc + customizable.price;
      }, 0),
    [basePrice, customizables, choices]
  );

  const handleSubmit = form.handleSubmit(async (data) => {
    await addToCartMutation.mutateAsync(data).catch(console.warn);
    form.reset();
  });

  if (outOfStock)
    return (
      <strong
        className={clsx(
          'fixed left-0 right-0 bottom-0 z-[11] btn-primary text-center cursor-not-allowed',
          'w-full shadow-[0_0_10px_5px_rgba(0,0,0,0.07)]',
          'md:mt-16 md:w-auto md:relative md:right-auto md:mx-auto'
        )}
      >
        Cet article n'est plus en stock.
      </strong>
    );

  return (
    <form
      onSubmit={handleSubmit}
      className={clsx('fixed left-0 right-0 bottom-0 z-[11] ', 'md:mt-16 md:relative md:right-auto')}
    >
      <Popover className={clsx(customizables.length > 0 ? 'md:hidden' : 'hidden')}>
        <Popover.Button className="btn-primary w-full ui-open:sr-only !outline-none">
          <span aria-hidden>Ajouter au panier</span>
          <span className="sr-only">Ouvrir la popup d'ajout au panier</span>
        </Popover.Button>
        <Popover.Panel>
          <div className="animate-slide-up transition-transform bg-white shadow-[0_0_10px_5px_rgba(0,0,0,0.1)]">
            <ChooseCustomizables className="mb-2" customizables={customizables} control={form.control} />
            <p className="text-center">Total: {applyTaxes(priceWithOptionsTaxExcluded).toFixed(2)}€</p>
          </div>
          <ButtonWithLoading
            loading={addToCartMutation.isPending}
            disabled={addToCartMutation.isPending}
            className="btn-primary w-full"
            type="submit"
            id="inStockArticle_add-to-cart-button"
          >
            Continuer
          </ButtonWithLoading>
        </Popover.Panel>
      </Popover>
      <div className="flex flex-col md:items-center">
        <div className={clsx(customizables.length > 0 && 'hidden md:inline-block')}>
          <ChooseCustomizables className="p-4" customizables={customizables} control={form.control} />
          <p className="text-center hidden md:block">Total: {applyTaxes(priceWithOptionsTaxExcluded).toFixed(2)}€</p>
          <ButtonWithLoading
            loading={addToCartMutation.isPending}
            disabled={addToCartMutation.isPending}
            className="btn-primary w-full"
            type="submit"
            id="inStockArticle_add-to-cart-button"
          >
            Ajouter au panier
          </ButtonWithLoading>
        </div>
      </div>
    </form>
  );
}

type CustomizablesProps = {
  className?: string;
  customizables: CustomizableNotPart[];
  control: Control<SchemaType>;
};

function ChooseCustomizables({ className, customizables, control }: CustomizablesProps) {
  return (
    <div className={clsx(className, 'md:max-w-52 px-4 md:px-0 empty:hidden')}>
      {customizables.map((customizable) => (
        <div key={customizable.uid}>
          <Field
            label={customizable.label + (customizable.price ? ` (+${applyTaxes(customizable.price)}€)` : '')}
            labelClassName="!items-start !mt-0"
            widgetId={customizable.uid}
            renderWidget={(className) => (
              <Controller
                control={control}
                name={`customizations.${customizable.uid}`}
                defaultValue={customizable.type === 'customizable-boolean' ? false : ''}
                render={({ field: { onChange, value, onBlur } }) =>
                  customizable.type === 'customizable-boolean' ? (
                    <input
                      type="checkbox"
                      id={customizable.uid}
                      className={className}
                      onChange={onChange}
                      checked={!!value}
                      onBlur={onBlur}
                    />
                  ) : (
                    <input
                      className={clsx('px-4 py-2 border rounded-md w-full', className)}
                      type="text"
                      id={customizable.uid}
                      minLength={customizable.min}
                      maxLength={customizable.max}
                      onChange={onChange}
                      value={value + ''}
                      onBlur={onBlur}
                    />
                  )
                }
              />
            )}
          />
        </div>
      ))}
    </div>
  );
}
