'use client';

import { ButtonWithLoading, Field } from '@couture-next/ui';
import { useCart } from '../../../../contexts/CartContext';
import { Customizable } from '@couture-next/types';
import { Control, Controller, DefaultValues, FormProvider, useController, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import clsx from 'clsx';
import { applyTaxes } from '@couture-next/utils';
import { Popover } from '@headlessui/react';
import { useCallback, useMemo } from 'react';
import { TRPCRouterInput } from '@couture-next/api-connector';

const schema = z.object({
  type: z.literal('inStock'),
  articleId: z.string(),
  stockUid: z.string(),
  customizations: z.record(z.union([z.string(), z.boolean()])),
  quantity: z.number().int().positive(),
}) satisfies z.ZodType<TRPCRouterInput['carts']['addToMyCart']>;

type SchemaType = z.infer<typeof schema>;

type CustomizableNotPart = Exclude<Customizable, { type: 'customizable-part' }>;

type Props = {
  defaultValues: DefaultValues<SchemaType>;
  customizables: CustomizableNotPart[];
  maxQuantity: number;
  basePrice: number;
  outOfStock?: boolean;
};

export default function AddToCartForm({ defaultValues, customizables, maxQuantity, outOfStock, basePrice }: Props) {
  const { addToCartMutation } = useCart();
  const form = useForm<SchemaType>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const choices = useWatch({ control: form.control, name: 'customizations', defaultValue: {} });
  const quantity = useWatch({ control: form.control, name: 'quantity', defaultValue: 1 });
  const priceWithOptionsTaxExcluded = useMemo(
    () =>
      quantity *
      (basePrice +
        Object.entries(choices).reduce((acc, [customizableUid, value]) => {
          if (!value) return acc;
          const customizable = customizables.find((customizable) => customizable.uid === customizableUid);
          if (!customizable) return acc;
          return acc + customizable.price;
        }, 0)),
    [basePrice, customizables, choices, quantity]
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
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit}
        className={clsx('fixed left-0 right-0 bottom-0 z-[11] ', 'md:relative md:right-auto')}
      >
        <Popover className={clsx(customizables.length > 0 || maxQuantity > 1 ? 'md:hidden' : 'hidden')}>
          <Popover.Button className="btn-primary w-full ui-open:sr-only !outline-none">
            <span aria-hidden>Ajouter au panier</span>
            <span className="sr-only">Ouvrir la popup d'ajout au panier</span>
          </Popover.Button>
          <Popover.Panel>
            <div className="animate-slide-up transition-transform bg-white shadow-[0_0_10px_5px_rgba(0,0,0,0.1)] space-y-2 pt-2">
              <ChooseQuantity max={maxQuantity} />
              <ChooseCustomizables className="mb-2" customizables={customizables} control={form.control} />
              <p className="text-center">Total: {applyTaxes(priceWithOptionsTaxExcluded).toFixed(2)}€</p>
            </div>
            <ButtonWithLoading
              loading={form.formState.isSubmitting}
              disabled={form.formState.isSubmitting}
              className="btn-primary w-full"
              type="submit"
              id="inStockArticle_add-to-cart-button"
            >
              Continuer
            </ButtonWithLoading>
          </Popover.Panel>
        </Popover>
        <div className="flex flex-col">
          <div className={clsx((customizables.length > 0 || maxQuantity > 1) && 'hidden md:inline-block space-y-2')}>
            <ChooseCustomizables className="pt-2 w-full" customizables={customizables} control={form.control} />
            <ChooseQuantity max={maxQuantity} className="hidden md:block w-full " />
            <p className="hidden md:block">Total: {applyTaxes(priceWithOptionsTaxExcluded).toFixed(2)}€</p>
            <ButtonWithLoading
              loading={form.formState.isSubmitting}
              disabled={form.formState.isSubmitting}
              className="btn-primary w-full"
              type="submit"
              // id="inStockArticle_add-to-cart-button"
            >
              Ajouter au panier
            </ButtonWithLoading>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

type CustomizablesProps = {
  className?: string;
  customizables: CustomizableNotPart[];
  control: Control<SchemaType>;
};

function ChooseCustomizables({ className, customizables, control }: CustomizablesProps) {
  return (
    <div className={clsx(className, ' px-4 md:px-0 empty:hidden')}>
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

const ChooseQuantity = ({ max, className }: { max: number; className?: string }) => {
  const { field, fieldState } = useController<SchemaType, 'quantity'>({ name: 'quantity', rules: {} });
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      field.onChange(value);
    },
    [field]
  );

  if (max === 1) return null;

  return (
    <div className={clsx(' px-4 md:px-0', className)}>
      <Field
        label="Quantité"
        labelClassName="!items-start !mt-0"
        widgetId="quantity"
        error={fieldState.error?.message}
        renderWidget={(className) => (
          <input
            type="number"
            id="quantity"
            className={className}
            {...field}
            min={1}
            step={1}
            max={max}
            onChange={onChange}
          />
        )}
      />
    </div>
  );
};
