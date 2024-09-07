import { Article } from '@couture-next/types';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { AddToCartFormType } from '../app';
import clsx from 'clsx';
import { Field } from '@couture-next/ui/form/Field';
import { applyTaxes } from '@couture-next/utils';
import React, { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import PipingWidget from './PipingWidget';
import EmbroideryWidget from '@couture-next/ui/form/EmbroideryWidget';

type Props = {
  className?: string;
  article: Article;
  register: UseFormRegister<AddToCartFormType>;
  errors: FieldErrors<AddToCartFormType>;
};

export default function FormChooseCustomizableFields({ className, article, register, errors }: Props) {
  const searchParams = useSearchParams();
  const selectedVariantId = searchParams.get('variant');
  const selectedVariant = useMemo(
    () => article.customizableVariants.find((customizableVariant) => customizableVariant.uid === selectedVariantId),
    [article.customizableVariants, selectedVariantId]
  );
  const inheritedCustomizables = useMemo(
    () => article.customizables.filter((customizable) => selectedVariant?.inherits.includes(customizable.uid)),
    [article.customizables, selectedVariant?.inherits]
  );

  if (!selectedVariant) {
    return null;
  }

  return (
    <div className={className}>
      <div>
        {inheritedCustomizables.map((customizable) => (
          <div key={customizable.uid}>
            <Field
              label={customizable.label + (customizable.price ? ` (+${applyTaxes(customizable.price)}€)` : '')}
              labelClassName="!items-start"
              widgetId={customizable.uid}
              error={errors.customizations?.[customizable.uid]?.message}
              required={!customizable.price}
              renderWidget={(className) =>
                customizable.type === 'customizable-boolean' ? (
                  <input
                    type="checkbox"
                    id={customizable.uid}
                    className={className}
                    {...register(`customizations.${customizable.uid}`)}
                  />
                ) : customizable.type === 'customizable-embroidery' ? (
                  <EmbroideryWidget customizableUid={customizable.uid} inputClassName={className} />
                ) : customizable.type === 'customizable-piping' ? (
                  <PipingWidget customizableUid={customizable.uid} buttonClassName={className} />
                ) : (
                  <input
                    className={clsx('px-4 py-2 border rounded-md', className)}
                    type="text"
                    id={customizable.uid}
                    minLength={customizable.min}
                    maxLength={customizable.max}
                    {...register(`customizations.${customizable.uid}`)}
                  />
                )
              }
            />
          </div>
        ))}
        <Field
          label="Quantité"
          labelClassName="!items-start"
          widgetId="quantity"
          required
          error={errors.quantity?.message}
          helpText={(article.minQuantity ?? 1) > 1 ? `Minimum: ${article.minQuantity}` : undefined}
          renderWidget={(className) => (
            <input
              className={clsx('px-4 py-2 border rounded-md', className)}
              type="number"
              id="quantity"
              min={article.minQuantity ?? 1}
              {...register(`quantity`, { valueAsNumber: true })}
            />
          )}
        />
        <Field
          label="Commentaire"
          labelClassName="!items-start"
          widgetId="comment"
          renderWidget={(className) => (
            <textarea
              className={clsx('px-4 py-2 border rounded-md', className)}
              placeholder="Une demande particulière ? Dites nous tout"
              id="comment"
              {...register(`comment`)}
            />
          )}
        />
      </div>
    </div>
  );
}
