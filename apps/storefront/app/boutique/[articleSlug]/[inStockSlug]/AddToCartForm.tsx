'use client';

import { ButtonWithLoading, Field } from '@couture-next/ui';
import { useCart } from '../../../../contexts/CartContext';
import { Article, CallAddToCartMutationPayload, Customizable } from '@couture-next/types';
import { DefaultValues, UseFormRegister, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import clsx from 'clsx';
import { applyTaxes } from '@couture-next/utils';

const schema = z.object({
  type: z.enum(['add-in-stock-item']),
  articleId: z.string(),
  stockUid: z.string(),
  customizations: z.record(z.union([z.string(), z.boolean()])),
}) satisfies z.ZodType<CallAddToCartMutationPayload>;

type SchemaType = z.infer<typeof schema>;

type CustomizableNotPart = Exclude<Customizable, { type: 'customizable-part' }>;

type Props = {
  defaultValues: DefaultValues<SchemaType>;
  customizables: CustomizableNotPart[];
};

export default function AddToCartForm({ defaultValues, customizables }: Props) {
  const { addToCartMutation } = useCart();
  const form = useForm<SchemaType>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = form.handleSubmit((data) => {
    addToCartMutation.mutateAsync(data);
  });

  return (
    <form onSubmit={handleSubmit} className="mt-16">
      <ChooseCustomizables className="mb-4" customizables={customizables} register={form.register} />
      <ButtonWithLoading
        loading={addToCartMutation.isPending}
        disabled={addToCartMutation.isPending}
        className="btn btn-primary mx-auto"
        type="submit"
        id="[inStockArticle]add-to-cart-button"
      >
        Ajouter au panier
      </ButtonWithLoading>
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
    <div className={clsx(className, 'flex flex-col items-center')}>
      <div className="">
        {customizables.map((customizable) => (
          <div key={customizable.uid}>
            <Field
              label={customizable.label + (customizable.price ? ` (+${applyTaxes(customizable.price)}€)` : '')}
              labelClassName="!items-start"
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
                    className={clsx('px-4 py-2 border rounded-md', className)}
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
