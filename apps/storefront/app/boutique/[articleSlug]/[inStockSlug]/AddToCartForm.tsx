'use client';

import { Field } from '@couture-next/ui/form/Field';
import { ButtonWithLoading } from '@couture-next/ui/ButtonWithLoading';
import { useCart } from '../../../../contexts/CartContext';
import { Option } from '@couture-next/types';
import { Control, Controller, DefaultValues, FormProvider, useController, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import clsx from 'clsx';
import { applyTaxes } from '@couture-next/utils';
import { useCallback, useMemo } from 'react';
import { TRPCRouterInput } from '@couture-next/api-connector';
import { useInView } from 'react-intersection-observer';
import { Transition } from '@headlessui/react';
import { useDebounce } from 'apps/storefront/hooks/useDebounce';
import EmbroideryWidget from '@couture-next/ui/form/EmbroideryWidget';

const schema = z.object({
  type: z.literal('inStock'),
  articleId: z.string(),
  stockUid: z.string(),
  customizations: z.record(z.unknown()),
  quantity: z.number().int().positive(),
}) satisfies z.ZodType<TRPCRouterInput['carts']['addToMyCart']>;

type SchemaType = z.infer<typeof schema>;

type OptionNotPiping = Exclude<Option, { type: 'customizable-piping' /** not supported yet */ }>;

type Props = {
  defaultValues: DefaultValues<SchemaType>;
  customizables: OptionNotPiping[];
  maxQuantity: number;
  basePrice: number;
  outOfStock?: boolean;
};

export default function AddToCartForm({ defaultValues, customizables, maxQuantity, outOfStock, basePrice }: Props) {
  const { addToCartMutation } = useCart();

  const schemaWithRefine = useMemo(
    () =>
      zodResolver(
        schema.extend({
          customizations: z
            .record(
              z.unknown().transform((v) => (typeof v === 'object' && v !== null && !(v as any)['text'] ? undefined : v))
            )
            .refine(
              (customizations) => {
                if (!customizables) return false;
                const allCustomizablesAreFilled = customizables.every((customizable) => {
                  if (customizable.type === 'customizable-boolean')
                    return typeof customizations[customizable.uid] === 'boolean';
                  if (customizable.type === 'customizable-text')
                    return typeof customizations[customizable.uid] === 'string';
                  // not handled
                  // if (customizable.type === 'customizable-piping')
                  //   return typeof customizations[customizable.uid] === 'string';
                  if (customizable.type === 'customizable-embroidery')
                    return z
                      .object({ text: z.string(), colorId: z.string() })
                      .optional()
                      .safeParse(customizations[customizable.uid]).success;

                  return false;
                });
                return allCustomizablesAreFilled;
              },
              {
                message: 'Remplis tous les champs',
              }
            ),
        })
      ),
    [customizables]
  );

  const form = useForm<SchemaType>({
    resolver: schemaWithRefine,
    defaultValues,
  });

  const [formRef, addToCartFormIsVisible, intersectionState] = useInView({
    delay: 100,
    threshold: 0.5,
  });
  const addToCartFormIsVisibleDebounced = useDebounce(addToCartFormIsVisible, 200);

  const choices = useWatch({ control: form.control, name: 'customizations', defaultValue: {} });
  const quantity = useWatch({ control: form.control, name: 'quantity', defaultValue: 1 });
  const priceWithOptionsTaxExcluded = useMemo(
    () =>
      quantity *
      (basePrice +
        Object.entries(choices).reduce((acc, [customizableUid, value]) => {
          const customizableConfig = customizables.find((customizable) => customizable.uid === customizableUid);
          if (!customizableConfig) return acc;

          const valueIsFilled =
            customizableConfig.type !== 'customizable-embroidery' ? !!value : !!(value as Record<string, string>)?.text;
          if (!valueIsFilled) return acc;

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
          'md:hidden'
        )}
      >
        Cet article n'est plus en stock.
      </strong>
    );

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit} ref={formRef}>
        <div className="flex flex-col">
          <div className="space-y-2">
            {(customizables.length > 0 || maxQuantity > 1) && (
              <>
                <ChooseCustomizables className="pt-2 w-full" customizables={customizables} control={form.control} />
                <ChooseQuantity max={maxQuantity} className="w-full" />
                <p>Total: {applyTaxes(priceWithOptionsTaxExcluded).toFixed(2)}€</p>
              </>
            )}
            <ButtonWithLoading
              loading={form.formState.isSubmitting}
              disabled={form.formState.isSubmitting || !form.formState.isValid}
              className={clsx('btn-primary w-full', !form.formState.isValid && 'cursor-not-allowed opacity-50')}
              type="submit"
            >
              Ajouter au panier
            </ButtonWithLoading>
          </div>
        </div>
      </form>
      <Transition
        as="div"
        show={!addToCartFormIsVisibleDebounced}
        className="fixed bottom-0 left-0 right-0 z-20 aria-hidden lg:hidden"
        enter="transition-transform transition-transform duration-300"
        enterFrom="transform translate-y-full"
        enterTo="transform translate-y-0"
        leave="transition-transform duration-300"
        leaveFrom="transform translate-y-0"
        leaveTo="transform translate-y-full"
        aria-hidden
      >
        <button
          className="btn-primary w-full text-center"
          tabIndex={-1}
          type="button"
          onClick={() => {
            intersectionState?.target?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Ajouter au panier
        </button>
      </Transition>
    </FormProvider>
  );
}

type CustomizablesProps = {
  className?: string;
  customizables: OptionNotPiping[];
  control: Control<SchemaType>;
};

function ChooseCustomizables({ className, customizables, control }: CustomizablesProps) {
  return (
    <div className={clsx(className, 'empty:hidden')}>
      {customizables.map((customizable) => (
        <div key={customizable.uid}>
          <Field
            label={customizable.label + (customizable.price ? ` (+${applyTaxes(customizable.price)}€)` : '')}
            labelClassName="!items-start !mt-0"
            widgetId={customizable.uid}
            renderWidget={(className) =>
              customizable.type !== 'customizable-embroidery' ? (
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
              ) : (
                <EmbroideryWidget customizableUid={customizable.uid} inputClassName={className} layout="vertical" />
              )
            }
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
    <div className={className}>
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
