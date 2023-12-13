import { Article, Customizable } from '@couture-next/types';
import { UseFormRegister, UseFormWatch } from 'react-hook-form';
import { AddToCartFormType } from './page';
import clsx from 'clsx';
import { Field } from '@couture-next/ui';
import { useMemo } from 'react';

type Props = {
  className?: string;
  article: Article;
  register: UseFormRegister<AddToCartFormType>;
  watch: UseFormWatch<AddToCartFormType>;
};

type CustomizableNotPart = Exclude<Customizable, { type: 'customizable-part' }>;

export default function FormChooseCustomizableFields({ className, article, register, watch }: Props) {
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
              label={customizable.label + (customizable.price ? ` (+${customizable.price}€)` : '')}
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
