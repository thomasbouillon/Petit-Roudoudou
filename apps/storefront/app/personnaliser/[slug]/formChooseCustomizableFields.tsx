import { Article, Customizable } from '@couture-next/types';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { AddToCartFormType } from './page';
import clsx from 'clsx';
import { Field } from '@couture-next/ui';
import { applyTaxes } from '@couture-next/utils';

type Props = {
  className?: string;
  article: Article;
  register: UseFormRegister<AddToCartFormType>;
  errors: FieldErrors<AddToCartFormType>;
};

type CustomizableNotPart = Exclude<Customizable, { type: 'customizable-part' }>;

export default function FormChooseCustomizableFields({ className, article, register, errors }: Props) {
  return (
    <div className={clsx(className, 'flex flex-col items-center')}>
      <div className="space-x-2">
        {(
          article.customizables.filter(
            (customizable) => customizable.type !== 'customizable-part'
          ) as CustomizableNotPart[]
        ).map((customizable) => (
          <div key={customizable.uid}>
            <Field
              label={customizable.label + (customizable.price ? ` (+${applyTaxes(customizable.price)}€)` : '')}
              labelClassName="!items-start"
              widgetId={customizable.uid}
              error={errors.customizations?.[customizable.uid]?.message}
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
        <Field
          label="Quantité"
          labelClassName="!items-start"
          widgetId="quantity"
          error={errors.quantity?.message}
          renderWidget={(className) => (
            <input
              className={clsx('px-4 py-2 border rounded-md', className)}
              type="number"
              id="quantity"
              {...register(`quantity`, { valueAsNumber: true })}
            />
          )}
        />
      </div>
    </div>
  );
}
