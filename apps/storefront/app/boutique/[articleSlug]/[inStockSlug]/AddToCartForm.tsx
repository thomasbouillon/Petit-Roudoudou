'use client';

import { ButtonWithLoading, Field } from '@couture-next/ui';
import { useCart } from '../../../../contexts/CartContext';
import { CallEditCartMutationPayload, Customizable } from '@couture-next/types';
import { DefaultValues, UseFormRegister, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import clsx from 'clsx';
import { applyTaxes } from '@couture-next/utils';
import { Popover } from '@headlessui/react';

const schema = z.object({
  type: z.enum(['add-in-stock-item']),
  articleId: z.string(),
  stockUid: z.string(),
  customizations: z.record(z.union([z.string(), z.boolean()])),
}) satisfies z.ZodType<CallEditCartMutationPayload>;

type SchemaType = z.infer<typeof schema>;

type CustomizableNotPart = Exclude<Customizable, { type: 'customizable-part' }>;

type Props = {
  defaultValues: DefaultValues<SchemaType>;
  customizables: CustomizableNotPart[];
  outOfStock?: boolean;
};

export default function AddToCartForm({ defaultValues, customizables, outOfStock }: Props) {
  const { addToCartMutation } = useCart();
  const form = useForm<SchemaType>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = form.handleSubmit((data) => {
    addToCartMutation.mutateAsync(data);
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
          <div className="animate-slide-up transition-transform bg-white">
            <ChooseCustomizables
              className="p-4 shadow-[0_0_10px_5px_rgba(0,0,0,0.07)]"
              customizables={customizables}
              register={form.register}
            />
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
      <div className={clsx(customizables.length > 0 && 'hidden md:block')}>
        <ChooseCustomizables className="p-4" customizables={customizables} register={form.register} />
        <ButtonWithLoading
          loading={addToCartMutation.isPending}
          disabled={addToCartMutation.isPending}
          className="btn-primary mx-auto w-full md:w-auto"
          type="submit"
          id="inStockArticle_add-to-cart-button"
        >
          Ajouter au panier
        </ButtonWithLoading>
      </div>
    </form>
  );
}

type CustomizablesProps = {
  className?: string;
  customizables: CustomizableNotPart[];
  register: UseFormRegister<SchemaType>;
};

function ChooseCustomizables({ className, customizables, register }: CustomizablesProps) {
  return (
    <div className={clsx(className, 'md:flex md:flex-col md:items-center px-4')}>
      <div className="">
        {customizables.map((customizable) => (
          <div key={customizable.uid}>
            <Field
              label={customizable.label + (customizable.price ? ` (+${applyTaxes(customizable.price)}€)` : '')}
              labelClassName="!items-start !mt-0"
              widgetId={customizable.uid}
              renderWidget={(className) =>
                customizable.type === 'customizable-boolean' ? (
                  <input
                    type="checkbox"
                    id={customizable.uid}
                    className={className}
                    {...register(`customizations.${customizable.uid}`)}
                  />
                ) : (
                  <input
                    className={clsx('px-4 py-2 border rounded-md w-full', className)}
                    type="text"
                    id={customizable.uid}
                    {...register(`customizations.${customizable.uid}`)}
                  />
                )
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
